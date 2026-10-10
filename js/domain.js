/* Reglas compartidas por el navegador, el worker y las pruebas. Sin dependencias. */
function BingoFactory() {
  'use strict';
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  function randomIndex(length) {
    assert(Number.isInteger(length) && length > 0 && length <= 4294967296, 'Rango aleatorio inválido.');
    const limit = Math.floor(4294967296 / length) * length;
    const buffer = new Uint32Array(1);
    do { globalThis.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return buffer[0] % length;
  }
  function shuffled(values, random = randomIndex) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = random(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  const range = (column) => [column === 0 ? 1 : column * 10, column === 8 ? 90 : column * 10 + 9];
  function validateCard(matrix) {
    assert(Array.isArray(matrix) && matrix.length === 3, 'El cartón debe tener tres filas.');
    const seen = new Set();
    for (const row of matrix) {
      assert(Array.isArray(row) && row.length === 9, 'El cartón debe tener nueve columnas.');
      assert(row.filter(n => n !== null).length === 5, 'Cada fila debe tener cinco números.');
      row.forEach((n, c) => {
        if (n === null) return;
        const [min, max] = range(c);
        assert(Number.isInteger(n) && n >= min && n <= max && !seen.has(n), 'Número de cartón inválido.');
        seen.add(n);
      });
    }
    for (let c = 0; c < 9; c++) {
      const numbers = matrix.map(row => row[c]).filter(n => n !== null);
      assert(numbers.length >= 1 && numbers.every((n, i) => i === 0 || n > numbers[i - 1]), 'Columna vacía o desordenada.');
    }
    return true;
  }
  function generateCard(random = randomIndex) {
    // Distribuir 15 lugares en nueve columnas y resolver las capacidades por fila.
    const counts = Array(9).fill(1);
    for (let i = 0; i < 6; i++) {
      const candidates = counts.map((n, c) => n < 3 ? c : -1).filter(c => c >= 0);
      counts[candidates[random(candidates.length)]]++;
    }
    const matrix = Array.from({ length: 3 }, () => Array(9).fill(null));
    const capacity = [5, 5, 5];
    const columns = counts.map((n, c) => c).sort((a, b) => counts[b] - counts[a]);
    function place(index) {
      if (index === 9) return capacity.every(n => n === 0);
      const c = columns[index];
      const options = shuffled([1, 2, 3, 4, 5, 6, 7].filter(mask => [0, 1, 2].filter(r => mask & (1 << r)).length === counts[c]), random);
      for (const mask of options) {
        const rows = [0, 1, 2].filter(r => mask & (1 << r));
        if (rows.some(r => capacity[r] === 0)) continue;
        rows.forEach(r => { capacity[r]--; matrix[r][c] = 0; });
        if (capacity.every(n => n <= 8 - index) && place(index + 1)) return true;
        rows.forEach(r => { capacity[r]++; matrix[r][c] = null; });
      }
      return false;
    }
    assert(place(0), 'No se pudo distribuir el cartón. Volvé a intentar.');
    for (let c = 0; c < 9; c++) {
      const [min, max] = range(c);
      const numbers = shuffled(Array.from({ length: max - min + 1 }, (_, i) => min + i), random).slice(0, counts[c]).sort((a, b) => a - b);
      let i = 0;
      matrix.forEach(row => { if (row[c] !== null) row[c] = numbers[i++]; });
    }
    validateCard(matrix);
    return matrix;
  }
  const fingerprint = matrix => matrix.flat().filter(n => n !== null).sort((a, b) => a - b).join(',');
  function generateCards(count, random = randomIndex, maxAttempts = count * 30) {
    assert(Number.isInteger(count) && count >= 1 && count <= 1000, 'Elegí entre 1 y 1000 cartones.');
    const cards = [], seen = new Set();
    for (let attempts = 0; cards.length < count && attempts < maxAttempts; attempts++) {
      const matrix = generateCard(random), key = fingerprint(matrix);
      if (!seen.has(key)) { seen.add(key); cards.push(matrix); }
    }
    assert(cards.length === count, 'No se pudo completar el set. No se guardó ningún cartón. Volvé a intentar.');
    return cards;
  }
  function draw(drawn, random = randomIndex, total = 90) {
    const hits = new Set(drawn);
    const available = Array.from({ length: total }, (_, i) => i + 1).filter(n => !hits.has(n));
    assert(available.length, 'El bolillero está agotado.');
    return available[random(available.length)];
  }
  function verify(matrix, drawn) {
    const hits = new Set(drawn);
    const missingRows = matrix.map(row => row.filter(n => n !== null && !hits.has(n)));
    const lines = missingRows.map((row, i) => row.length === 0 ? i + 1 : null).filter(Boolean);
    return { lines, line: lines.length > 0, bingo: missingRows.every(row => row.length === 0), missingRows, missing: missingRows.flat().sort((a, b) => a - b) };
  }
  const musicSize = total => Math.max(1, Math.floor(total / 6));
  function audioReference(value) {
    assert(value === null || typeof value === 'string', 'La ruta debe ser texto.');
    if (value === null || !value.trim()) return null;
    assert(!/[\x00-\x1f\x7f]/.test(value), 'La ruta contiene caracteres de control.');
    const path = value.trim().normalize('NFC').replace(/\\/g, '/');
    assert(!/^[a-z][a-z\d+.-]*:/i.test(path) || /^[a-z]:\//i.test(path), 'Usá una ruta local, no una URL.');
    assert(!path.split('/').includes('..'), 'La ruta no puede contener segmentos «..».');
    assert(!path.endsWith('/'), 'La ruta debe incluir el nombre del archivo.');
    return value.trim();
  }
  function referenceKey(value) {
    const path = (audioReference(value) || '').normalize('NFC').replace(/\\/g, '/');
    return path.split('/').filter(part => part !== '.').join('/').replace(/^[a-z]:/i, drive => drive.toUpperCase());
  }
  function folderSongs(files) {
    const rows = [], ignored = [], seen = new Map();
    const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
    for (const file of files) {
      const path = (file.webkitRelativePath || '').replace(/\\/g, '/');
      let reason = '';
      if (!/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(file.name)) reason = 'No es un formato de audio del listado';
      else if (!file.size) reason = 'Archivo vacío';
      else {
        try { if (!path || path.startsWith('/') || /^[a-z]:/i.test(path)) throw Error('Falta una ruta relativa de carpeta'); audioReference(path); }
        catch (error) { reason = error.message; }
      }
      if (reason) { ignored.push({ name: path || file.name, reason }); continue; }
      const prior = seen.get(path);
      if (prior) {
        if (prior.file === file || (prior.file.size === file.size && prior.file.lastModified === file.lastModified)) continue;
        throw new Error('La carpeta contiene rutas repetidas incompatibles. Elegila nuevamente.');
      }
      const row = { id: String(rows.length + 1), file, relativePath: path, title: file.name.replace(/\.[^.]+$/, '').trim(), included: true };
      rows.push(row); seen.set(path, row);
    }
    rows.sort((a, b) => collator.compare(a.relativePath, b.relativePath) || (a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0));
    return { rows, ignored };
  }
  function moveFolderSong(rows, id, direction) {
    const index = rows.findIndex(row => row.id === id), target = index + direction;
    if (![-1, 1].includes(direction) || index < 0 || target < 0 || target >= rows.length) return rows;
    const next = [...rows]; [next[index], next[target]] = [next[target], next[index]]; return next;
  }
  function folderSelection(rows) {
    const selected = rows.filter(row => row.included).map(row => ({ ...row, title: row.title.trim() }));
    assert(selected.length, 'Incluí al menos una canción.');
    assert(selected.every(row => row.title), 'Completá los títulos de las canciones incluidas.');
    return selected;
  }
  function combinations(n, k) {
    if (k < 0 || k > n) return 0n;
    k = Math.min(k, n - k);
    let value = 1n;
    for (let i = 1; i <= k; i++) value = value * BigInt(n - k + i) / BigInt(i);
    return value;
  }
  function validateMusicSize(total, size) {
    assert(Number.isSafeInteger(total) && total > 0, 'Cargá al menos una canción.');
    assert(Number.isInteger(size) && size >= 1 && size <= Math.min(15, total), `Elegí entre 1 y ${Math.min(15, total)} canciones por cartón.`);
    return true;
  }
  function musicLimit(total, size) {
    validateMusicSize(total, size);
    const space = combinations(total, size);
    return Number(space < 1000n ? space : 1000n);
  }
  function validateMusicMatrix(matrix, numbers, total) {
    validateMusicSize(total, numbers?.length);
    assert(Array.isArray(numbers) && Array.from(numbers).every((n, i) => Number.isSafeInteger(n) && n >= 1 && n <= total && (!i || n > numbers[i - 1])), 'Números musicales inválidos.');
    assert(Array.isArray(matrix) && matrix.length === 3, 'La grilla musical debe tener tres filas.');
    const found = [], counts = [];
    for (const row of matrix) {
      assert(Array.isArray(row) && row.length === 9, 'La grilla musical debe tener nueve columnas.');
      let count = 0;
      for (const n of row) {
        if (n === null) continue;
        assert(Number.isSafeInteger(n) && n >= 1 && n <= total, 'Casilla musical inválida.');
        found.push(n); count++;
      }
      counts.push(count);
    }
    assert(Math.max(...counts) <= 5 && Math.max(...counts) - Math.min(...counts) <= 1, 'Filas musicales desequilibradas.');
    assert(found.length === numbers.length && found.every((n, i) => n === numbers[i]), 'La grilla no coincide con los números del cartón.');
    return true;
  }
  function generateMusicMatrix(numbers, total, random = randomIndex) {
    validateMusicSize(total, numbers.length);
    const counts = Array(3).fill(Math.floor(numbers.length / 3));
    shuffled([0, 1, 2], random).slice(0, numbers.length % 3).forEach(r => counts[r]++);
    let index = 0;
    const matrix = counts.map(count => {
      const row = Array(9).fill(null);
      shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8], random).slice(0, count).sort((a, b) => a - b).forEach(c => { row[c] = numbers[index++]; });
      return row;
    });
    validateMusicMatrix(matrix, numbers, total);
    return matrix;
  }
  function randomBigInt(limit) {
    assert(limit > 0n, 'Rango de combinaciones inválido.');
    if (limit === 1n) return 0n;
    const bits = (limit - 1n).toString(2).length;
    const bytes = new Uint8Array(Math.ceil(bits / 8));
    for (;;) {
      // getRandomValues admite hasta 65536 bytes por llamada.
      for (let start = 0; start < bytes.length; start += 65536) globalThis.crypto.getRandomValues(bytes.subarray(start, start + 65536));
      bytes[0] &= (1 << (bits % 8 || 8)) - 1;
      let value = 0n;
      for (const byte of bytes) value = (value << 8n) | BigInt(byte);
      if (value < limit) return value;
    }
  }
  function unrank(n, k, rank) {
    const result = [];
    let candidate = 1;
    while (k > 0) {
      const count = combinations(n - candidate, k - 1);
      if (rank < count) { result.push(candidate); k--; }
      else rank -= count;
      candidate++;
    }
    return result;
  }
  function generateMusicCards(total, count, size, random = randomBigInt) {
    assert(Number.isSafeInteger(total) && total > 0, 'Cargá al menos una canción.');
    validateMusicSize(total, size);
    const space = combinations(total, size);
    assert(Number.isInteger(count) && count >= 1 && count <= 1000 && BigInt(count) <= space, `Podés generar entre 1 y ${musicLimit(total, size)} cartones distintos.`);
    // Muestreo de Floyd: siempre termina, incluso si se solicita todo el espacio.
    const ranks = new Set();
    for (let j = space - BigInt(count); j < space; j++) {
      const candidate = random(j + 1n);
      ranks.add(ranks.has(candidate) ? j : candidate);
    }
    return [...ranks].map(rank => unrank(total, size, rank));
  }
  const totalFor = set => set?.mode === 'music' ? set.songs.length : 90;
  function verifyMusic(numbers, drawn) {
    const hits = new Set(drawn), missing = numbers.filter(n => !hits.has(n));
    return { bingo: missing.length === 0, missing };
  }
  function validateClip(clip, duration) {
    assert(clip && Number.isSafeInteger(clip.start) && clip.start >= 0, 'Inicio inválido.');
    assert(clip.end === null || (Number.isSafeInteger(clip.end) && clip.end > clip.start), 'El fin debe ser posterior al inicio.');
    if (duration !== undefined) {
      assert(Number.isFinite(duration) && duration > 0, 'No se pudo determinar la duración del audio.');
      assert(clip.start < duration && (clip.end === null || clip.end <= duration), 'El fragmento no cabe en este archivo. Revisá inicio y fin.');
    }
    return { start: clip.start, end: clip.end };
  }
  function parseTime(text, empty = 0) {
    const value = String(text).trim();
    if (!value) return empty;
    assert(/^\d+:[0-5]\d$/.test(value), 'Usá minutos:segundos, por ejemplo 00:45.');
    const [minutes, seconds] = value.split(':').map(Number), total = minutes * 60 + seconds;
    assert(Number.isSafeInteger(total) && total >= 0, 'El tiempo es demasiado grande.');
    return total;
  }
  const formatTime = seconds => seconds === null ? '' : `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const emptyState = () => ({ version: 5, nextCode: 1, selectedGame: null, sets: [], games: [] });
  function validateState(input) {
    assert(input && [1, 2, 3, 4, 5].includes(input.version), 'Versión de respaldo no compatible.');
    assert(Array.isArray(input.sets) && Array.isArray(input.games), 'Respaldo incompleto.');
    const state = structuredClone(input), ids = new Set(), codes = new Set(), gameIds = new Set();
    if (state.version < 5) state.sets.forEach(set => {
      assert(set && set.cardLayout === undefined && (!Array.isArray(set.cards) || set.cards.every(card => card && card.musicMatrix === undefined)), 'Un respaldo anterior no admite grillas musicales.');
    });
    if (state.version === 1) {
      state.sets.forEach(set => { assert(set && !set.songs && !set.cardSize && (!set.mode || set.mode === 'classic'), 'Un respaldo versión 1 solo admite sets clásicos.'); set.mode = 'classic'; });
      state.version = 2;
    }
    if (state.version === 2) {
      state.sets.forEach(set => {
        assert(set && set.clips === undefined, 'Un respaldo anterior no admite fragmentos.');
        if (set.mode === 'music' && Array.isArray(set.songs)) set.clips = set.songs.map(() => ({ start: 0, end: null }));
      });
      state.version = 3;
    }
    if (state.version === 3) {
      state.sets.forEach(set => {
        assert(set && set.audioRefs === undefined, 'Un respaldo anterior no admite referencias de audio.');
        if (set.mode === 'music' && Array.isArray(set.songs)) set.audioRefs = set.songs.map(() => null);
      });
      state.version = 4;
    }
    if (state.version === 4) {
      state.sets.forEach(set => { if (set.mode === 'music') set.cardLayout = 'list'; });
      state.version = 5;
    }
    const text = value => typeof value === 'string' && value.length > 0 && value.length <= 100;
    let maxCode = 0;
    state.sets.forEach(set => {
      assert(set && text(set.id) && !ids.has(set.id) && text(set.name) && text(set.createdAt), 'Set inválido o repetido.');
      ids.add(set.id);
      assert(['classic', 'music'].includes(set.mode), 'Modalidad de set inválida.');
      if (set.mode === 'music') {
        assert(Array.isArray(set.songs) && set.songs.length > 0 && set.songs.every(song => typeof song === 'string' && song.length > 0 && song === song.trim()), 'Listado de canciones inválido.');
        assert(['list', 'grid-3x9'].includes(set.cardLayout), 'Formato musical inválido.');
        if (set.cardLayout === 'list') assert(set.cardSize === musicSize(set.songs.length), 'Tamaño de cartón musical inválido.');
        else validateMusicSize(set.songs.length, set.cardSize);
        assert(Array.isArray(set.clips) && set.clips.length === set.songs.length, 'Fragmentos musicales incompletos.');
        for (let i = 0; i < set.clips.length; i++) validateClip(set.clips[i]);
        assert(Array.isArray(set.audioRefs) && set.audioRefs.length === set.songs.length, 'Referencias musicales incompletas.');
        for (let i = 0; i < set.audioRefs.length; i++) assert(audioReference(set.audioRefs[i]) === set.audioRefs[i], 'Referencia musical inválida.');
      } else assert(set.cardLayout === undefined && set.songs === undefined && set.cardSize === undefined && set.clips === undefined && set.audioRefs === undefined, 'Un set clásico no debe contener un listado musical.');
      assert(Array.isArray(set.cards) && set.cards.length >= 1 && set.cards.length <= 1000, 'Cantidad de cartones inválida.');
      const prints = new Set();
      set.cards.forEach(card => {
        assert(card && Number.isSafeInteger(card.code) && card.code > 0 && !codes.has(card.code), 'Código de cartón inválido o repetido.');
        let key;
        if (set.mode === 'music') {
          assert(card.matrix === undefined && Array.isArray(card.numbers) && card.numbers.length === set.cardSize && Array.from(card.numbers).every((n, i) => Number.isInteger(n) && n >= 1 && n <= set.songs.length && (i === 0 || n > card.numbers[i - 1])), 'Índices de cartón musical inválidos.');
          if (set.cardLayout === 'grid-3x9') validateMusicMatrix(card.musicMatrix, card.numbers, set.songs.length);
          else assert(card.musicMatrix === undefined, 'Un cartón de lista no admite grilla.');
          key = card.numbers.join(',');
        } else {
          assert(card.numbers === undefined && card.musicMatrix === undefined, 'Cartón clásico inválido.');
          validateCard(card.matrix); key = fingerprint(card.matrix);
        }
        assert(!prints.has(key), 'Hay cartones duplicados dentro de un set.');
        prints.add(key); codes.add(card.code); maxCode = Math.max(maxCode, card.code);
      });
    });
    state.games.forEach(game => {
      assert(game && text(game.id) && !gameIds.has(game.id) && text(game.name) && text(game.createdAt) && ids.has(game.setId), 'Partida inválida o sin set.');
      const total = totalFor(state.sets.find(set => set.id === game.setId));
      assert(Array.isArray(game.drawn) && game.drawn.length <= total && new Set(game.drawn).size === game.drawn.length && game.drawn.every(n => Number.isInteger(n) && n >= 1 && n <= total), 'Historial de bolillas inválido.');
      gameIds.add(game.id);
    });
    assert(state.selectedGame === null || gameIds.has(state.selectedGame), 'La partida seleccionada no existe.');
    assert(Number.isSafeInteger(state.nextCode) && state.nextCode > maxCode, 'El contador de códigos no es válido.');
    return state;
  }
  function findCard(state, game, rawCode) {
    assert(game, 'Seleccioná una partida antes de verificar.');
    const code = String(rawCode).trim();
    assert(/^[1-9]\d*$/.test(code) && Number.isSafeInteger(Number(code)), 'Ingresá un código numérico válido, sin ceros iniciales.');
    for (const set of state.sets) {
      const card = set.cards.find(c => c.code === Number(code));
      if (card) { assert(set.id === game.setId, 'Este cartón pertenece a otro set.'); return card; }
    }
    throw new Error('No se encontró un cartón con ese código.');
  }
  return { validateMusicSize, validateMusicMatrix, generateMusicMatrix, audioReference, referenceKey, folderSongs, moveFolderSong, folderSelection, validateClip, parseTime, formatTime, randomIndex, generateCard, generateCards, validateCard, fingerprint, draw, verify, emptyState, validateState, findCard, musicSize, musicLimit, combinations, randomBigInt, generateMusicCards, totalFor, verifyMusic };
}
const Bingo = BingoFactory();
if (typeof module !== 'undefined') module.exports = Bingo;
