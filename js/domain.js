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
  function parseSongs(bytes) {
    let text;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { throw new Error('El archivo debe estar guardado como texto UTF-8.'); }
    const songs = text.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/).map(line => line.trim()).filter(Boolean);
    assert(songs.length > 0, 'El archivo no contiene canciones.');
    const seen = new Set(), duplicates = new Set();
    songs.forEach(song => { if (seen.has(song)) duplicates.add(song); seen.add(song); });
    return { songs, duplicates: [...duplicates] };
  }
  const musicSize = total => Math.max(1, Math.floor(total / 6));
  function combinations(n, k) {
    if (k < 0 || k > n) return 0n;
    k = Math.min(k, n - k);
    let value = 1n;
    for (let i = 1; i <= k; i++) value = value * BigInt(n - k + i) / BigInt(i);
    return value;
  }
  const musicLimit = total => Number(combinations(total, musicSize(total)) < 1000n ? combinations(total, musicSize(total)) : 1000n);
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
  function generateMusicCards(total, count, random = randomBigInt) {
    assert(Number.isSafeInteger(total) && total > 0, 'Cargá al menos una canción.');
    const size = musicSize(total), space = combinations(total, size);
    assert(Number.isInteger(count) && count >= 1 && count <= 1000 && BigInt(count) <= space, `Podés generar entre 1 y ${musicLimit(total)} cartones distintos.`);
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
  const emptyState = () => ({ version: 2, nextCode: 1, selectedGame: null, sets: [], games: [] });
  function validateState(input) {
    assert(input && [1, 2].includes(input.version), 'Versión de respaldo no compatible.');
    assert(Array.isArray(input.sets) && Array.isArray(input.games), 'Respaldo incompleto.');
    const state = structuredClone(input), ids = new Set(), codes = new Set(), gameIds = new Set();
    if (state.version === 1) {
      state.sets.forEach(set => { assert(set && !set.songs && !set.cardSize && (!set.mode || set.mode === 'classic'), 'Un respaldo versión 1 solo admite sets clásicos.'); set.mode = 'classic'; });
      state.version = 2;
    }
    const text = value => typeof value === 'string' && value.length > 0 && value.length <= 100;
    let maxCode = 0;
    state.sets.forEach(set => {
      assert(set && text(set.id) && !ids.has(set.id) && text(set.name) && text(set.createdAt), 'Set inválido o repetido.');
      ids.add(set.id);
      assert(['classic', 'music'].includes(set.mode), 'Modalidad de set inválida.');
      if (set.mode === 'music') {
        assert(Array.isArray(set.songs) && set.songs.length > 0 && set.songs.every(song => typeof song === 'string' && song.length > 0 && song === song.trim() && !/[\r\n]/.test(song)), 'Listado de canciones inválido.');
        assert(set.cardSize === musicSize(set.songs.length), 'Tamaño de cartón musical inválido.');
      } else assert(set.songs === undefined && set.cardSize === undefined, 'Un set clásico no debe contener un listado musical.');
      assert(Array.isArray(set.cards) && set.cards.length >= 1 && set.cards.length <= 1000, 'Cantidad de cartones inválida.');
      const prints = new Set();
      set.cards.forEach(card => {
        assert(card && Number.isSafeInteger(card.code) && card.code > 0 && !codes.has(card.code), 'Código de cartón inválido o repetido.');
        let key;
        if (set.mode === 'music') {
          assert(card.matrix === undefined && Array.isArray(card.numbers) && card.numbers.length === set.cardSize && card.numbers.every((n, i) => Number.isInteger(n) && n >= 1 && n <= set.songs.length && (i === 0 || n > card.numbers[i - 1])), 'Índices de cartón musical inválidos.');
          key = card.numbers.join(',');
        } else {
          assert(card.numbers === undefined, 'Cartón clásico inválido.');
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
  return { randomIndex, generateCard, generateCards, validateCard, fingerprint, draw, verify, emptyState, validateState, findCard, parseSongs, musicSize, musicLimit, combinations, randomBigInt, generateMusicCards, totalFor, verifyMusic };
}
const Bingo = BingoFactory();
if (typeof module !== 'undefined') module.exports = Bingo;
