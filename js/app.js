'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let state = Bingo.emptyState(), writable = false, busy = false, snapshot = null, previewSet = null, previewPage = 0, pendingImport = null, lockPending = false;
  let releaseLock, noticeTimer;
  let draftSongs = [], loadToken = 0, musicPages = [], boardSetId;
  const modeName = set => set?.mode === 'music' ? 'Musical' : 'Clásico';
  const game = () => state.games.find(g => g.id === state.selectedGame);
  const setFor = g => state.sets.find(s => s.id === g?.setId);
  function notice(message, error = false) {
    clearTimeout(noticeTimer); $('notice').textContent = message; $('notice').classList.toggle('error', error); $('notice').hidden = false;
    noticeTimer = setTimeout(() => $('notice').hidden = true, error ? 10000 : 5000);
  }
  function element(tag, className, text) {
    const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
  }
  function showView(name) {
    $('game-view').hidden = name !== 'game'; $('sets-view').hidden = name !== 'sets';
    document.querySelectorAll('[data-view]').forEach(button => { const active = button.dataset.view === name; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    document.body.classList.remove('expanded');
  }
  function controls() {
    const disabled = !writable || busy;
    ['new-game', 'generate', 'import', 'game-select', 'game-set', 'confirm-import', 'set-mode', 'songs-file'].forEach(id => $(id).disabled = disabled);
    $('generate').disabled = disabled || ($('set-mode').value === 'music' && !draftSongs.length);
    $('new-game').disabled = disabled || !state.sets.length;
    $('draw').disabled = disabled || !game() || game().drawn.length >= Bingo.totalFor(setFor(game())) || Boolean(snapshot);
    $('verify-open').disabled = !writable || busy || !game();
    $('export').disabled = busy;
    $('lock-warning').hidden = writable;
    $('generate').textContent = busy ? 'Procesando…' : 'Generar cartones ＋';
    $('draw').textContent = game()?.drawn.length === Bingo.totalFor(setFor(game())) ? 'Bolillero agotado' : 'Sacar bolilla →';
  }
  async function mutate(change, success) {
    if (!writable || busy) return false;
    busy = true; controls();
    try { state = await BingoStorage.update(change); render(); if (success) notice(success); return true; }
    catch (error) { notice(error.message, true); return false; }
    finally { busy = false; controls(); }
  }
  function fillOptions(select, options, selected, empty) {
    select.replaceChildren();
    if (!options.length) select.append(new Option(empty, ''));
    options.forEach(item => select.append(new Option(item.name, item.id)));
    if (selected) select.value = selected;
  }
  function render() {
    const current = game(), drawn = current?.drawn || [], last = drawn.at(-1), currentSet = setFor(current);
    const musical = currentSet?.mode === 'music', total = Bingo.totalFor(currentSet);
    $('set-count').textContent = state.sets.length;
    fillOptions($('game-select'), [...state.games].reverse().map(g => ({ ...g, name: `${g.name} · ${modeName(setFor(g))}` })), state.selectedGame, 'Sin partida todavía');
    fillOptions($('game-set'), [...state.sets].reverse().map(s => ({ ...s, name: `${s.name} · ${modeName(s)}` })), $('game-set').value, 'Primero generá un set');
    $('game-set-label').textContent = currentSet ? `${currentSet.name} · ${currentSet.cards.length} cartones` : '';
    if (boardSetId !== currentSet?.id || !$('board').children.length) {
      boardSetId = currentSet?.id;
      $('song-detail').hidden = true;
      $('board').replaceChildren();
      for (let n = 1; n <= total; n++) {
        const cell = element(musical ? 'button' : 'div', 'number-cell', n);
        if (musical) attachSong(cell, n, currentSet);
        $('board').append(cell);
      }
    }
    $('board').setAttribute('aria-label', `Tablero ${modeName(currentSet)} del 1 al ${total}`);
    [...$('board').children].forEach((cell, i) => {
      const n = i + 1;
      cell.classList.toggle('hit', drawn.includes(n)); cell.classList.toggle('latest', n === last);
      cell.setAttribute('aria-label', `${n}${musical ? ' · ' + currentSet.songs[i] : ''}${n === last ? ', última bolilla' : drawn.includes(n) ? ', ya salió' : ', por salir'}`);
    });
    $('draw-count').textContent = drawn.length; $('ball-total').textContent = total; $('remaining').textContent = `${total - drawn.length} por salir`; $('last-ball').textContent = last || '—';
    $('last-song').hidden = !musical || !last; $('last-song').textContent = musical && last ? currentSet.songs[last - 1] : '';
    $('claim-help').textContent = musical ? 'Solo bingo completo. Verificá con el código del cartón.' : 'Comprobá línea o bingo con su código.';
    $('footer-mode').textContent = `${musical ? 'Musical · ' : ''}${total} bolillas · Sin conexión · Sin apuro`;
    $('draw-hint').textContent = !current ? 'Creá una partida para empezar' : drawn.length === total ? '¡Ya salieron todas las bolillas!' : last ? `Bolilla ${drawn.length} de ${total} · Seguimos jugando` : 'La primera está por llegar';
    const historyFocus = document.activeElement?.closest('#history') ? document.activeElement.dataset.number : null;
    $('history').replaceChildren(...(drawn.length ? drawn.map((n, i) => { const ball = element(musical ? 'button' : 'span', 'history-ball', n); ball.title = `Extracción ${i + 1}`; if (musical) attachSong(ball, n, currentSet); return ball; }) : [element('p', '', 'Todavía no salió ninguna bolilla. La primera está por llegar.')]));
    if (historyFocus) $('history').querySelector(`[data-number="${historyFocus}"]`)?.focus({ preventScroll: true });
    $('game-empty').hidden = state.sets.length > 0;
    $('cards-total').textContent = `${state.sets.reduce((n, s) => n + s.cards.length, 0)} cartones`;
    $('sets-list').replaceChildren();
    if (!state.sets.length) $('sets-list').append(element('div', 'empty-sets', 'Tu primer set empieza acá.\nDale un nombre, elegí la cantidad y prepará los cartones.'));
    [...state.sets].reverse().forEach(set => {
      const row = element('article', 'set-row'), info = element('div', 'set-info');
      info.append(element('h3', '', set.name), element('p', '', `${modeName(set)} · ${set.cards.length} cartones · Códigos ${set.cards[0].code}–${set.cards.at(-1).code}${set.mode === 'music' ? ` · ${set.songs.length} canciones, ${set.cardSize} por cartón` : ''}`));
      const preview = element('button', 'button secondary', 'Ver / Imprimir'); preview.onclick = () => openPreview(set.id);
      const play = element('button', 'text-button', 'Jugar →'); play.disabled = !writable; play.onclick = () => openGame(set.id);
      row.append(element('span', 'set-icon', '▦'), info, preview, play); $('sets-list').append(row);
    });
    controls();
  }
  function attachSong(node, n, set) {
    node.type = 'button'; node.dataset.number = n;
    node.setAttribute('aria-label', `${n} · ${set.songs[n - 1]}`);
    const show = () => { $('song-detail').textContent = `${n} · ${set.songs[n - 1]}`; $('song-detail').hidden = false; node.setAttribute('aria-describedby', 'song-detail'); };
    const hide = () => { if (document.activeElement === node) return; $('song-detail').hidden = true; node.removeAttribute('aria-describedby'); };
    node.addEventListener('mouseenter', show); node.addEventListener('focus', show); node.addEventListener('click', show);
    node.addEventListener('mouseleave', hide); node.addEventListener('blur', () => { $('song-detail').hidden = true; node.removeAttribute('aria-describedby'); });
    node.addEventListener('keydown', event => { if (event.key === 'Escape') { $('song-detail').hidden = true; event.stopPropagation(); } });
  }
  function ticket(card, set, drawn = []) {
    if (set.mode === 'music') return BingoMusicPrint.ticket(card, set, drawn);
    const article = element('article', 'ticket'), header = element('div', 'ticket-heading'), grid = element('div', 'ticket-grid');
    header.append(element('span', '', `BINGO 90 · ${set.name}`), element('strong', '', `N.º ${card.code}`));
    card.matrix.flat().forEach(n => { const cell = element('span', `ticket-cell${n === null ? ' blank' : drawn.includes(n) ? ' matched' : ''}`, n ?? ''); if (n === null) cell.setAttribute('aria-label', 'Casilla vacía'); grid.append(cell); });
    article.dataset.code = card.code;
    article.append(header, grid, element('div', 'ticket-footer', '15 NÚMEROS · UNA LÍNEA, CINCO ACIERTOS · BINGO, CARTÓN COMPLETO'));
    return article;
  }
  function openPreview(id) {
    previewSet = state.sets.find(s => s.id === id); previewPage = 0;
    try { musicPages = previewSet.mode === 'music' ? BingoMusicPrint.pages(previewSet) : []; renderPreview(); $('preview-dialog').showModal(); }
    catch (error) { notice(`No se pudo preparar la impresión: ${error.message}`, true); }
  }
  function renderPreview() {
    $('preview-title').textContent = previewSet.name;
    if (previewSet.mode === 'music') {
      $('preview-cards').classList.add('music-preview');
      $('preview-cards').replaceChildren(musicPages[previewPage].cloneNode(true));
      $('preview-page').textContent = `Hoja ${previewPage + 1} de ${musicPages.length}`;
      $('preview-prev').disabled = previewPage === 0; $('preview-next').disabled = previewPage + 1 === musicPages.length;
      $('print-root').replaceChildren(...musicPages.map(page => page.cloneNode(true)));
      return;
    }
    $('preview-cards').classList.remove('music-preview');
    $('preview-cards').replaceChildren(...previewSet.cards.slice(previewPage * 6, previewPage * 6 + 6).map(card => ticket(card, previewSet)));
    const total = Math.ceil(previewSet.cards.length / 6); $('preview-page').textContent = `Hoja ${previewPage + 1} de ${total}`;
    $('preview-prev').disabled = previewPage === 0; $('preview-next').disabled = previewPage + 1 === total;
    $('print-root').replaceChildren();
    for (let i = 0; i < previewSet.cards.length; i += 6) {
      const page = element('section', 'print-page'); page.append(...previewSet.cards.slice(i, i + 6).map(card => ticket(card, previewSet))); $('print-root').append(page);
    }
  }
  function openGame(setId) {
    if (!writable || busy || !state.sets.length) return;
    if (setId) $('game-set').value = setId;
    $('game-name').value = `Ronda ${state.games.length + 1}`; $('game-dialog').showModal(); $('game-name').focus(); $('game-name').select();
  }
  async function acquireLock() {
    if (lockPending || writable) return;
    if (!navigator.locks) { notice('Este navegador no permite el bloqueo entre pestañas. Abrí la aplicación con Chrome o Edge usando el servidor local indicado en README.', true); return; }
    lockPending = true;
    try {
      await navigator.locks.request('bingo90-operator', { ifAvailable: true }, async lock => {
        if (!lock) return;
        writable = true; state = await BingoStorage.read(); render();
        await new Promise(resolve => { releaseLock = resolve; }); writable = false;
      });
    } catch (error) { writable = false; notice(error.message, true); }
    finally { lockPending = false; controls(); }
  }
  function generateInWorker(count, total = null) {
    return new Promise((resolve, reject) => {
      const source = `const Bingo = (${BingoFactory.toString()})(); onmessage = event => { try { const {count,total} = event.data; postMessage({cards: total === null ? Bingo.generateCards(count) : Bingo.generateMusicCards(total,count)}); } catch(error) { postMessage({error:error.message}); } };`;
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      let worker;
      const cleanup = () => { worker?.terminate(); URL.revokeObjectURL(url); };
      try {
        worker = new Worker(url);
        worker.onmessage = e => { cleanup(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.cards); };
        worker.onerror = () => { cleanup(); reject(new Error('No se pudo generar el set. Probá abrir la aplicación desde el servidor local.')); };
        worker.postMessage({ count, total });
      } catch (error) { cleanup(); reject(error); }
    });
  }
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => showView(button.dataset.view));
  document.querySelector('.brand').onclick = event => { event.preventDefault(); showView('game'); };
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close());
  $('go-sets').onclick = () => { showView('sets'); $('set-name').focus(); };
  $('new-game').onclick = () => openGame(); $('take-control').onclick = acquireLock;
  function updateDraft() {
    const musical = $('set-mode').value === 'music', total = draftSongs.length;
    $('music-upload').hidden = !musical;
    const max = musical && total ? Bingo.musicLimit(total) : 1000;
    $('quantity').max = max;
    if (Number($('quantity').value) > max) $('quantity').value = max;
    $('quantity-help').textContent = musical ? total ? `Entre 1 y ${max} cartones · ${Bingo.musicSize(total)} canciones por cartón` : 'Primero cargá el listado de canciones.' : 'Entre 1 y 1000 · 15 números por cartón';
    $('print-help').textContent = musical ? 'Número y nombre de cada canción. Hojas A4 adaptadas al contenido.' : '6 cartones por hoja A4, con su código y guías de corte.';
    controls();
  }
  $('set-mode').onchange = () => {
    loadToken++; draftSongs = []; $('songs-file').value = ''; $('songs-preview').replaceChildren();
    $('songs-summary').textContent = 'Cargá un TXT con una canción por línea.';
    $('songs-warning').hidden = true; $('songs-details').hidden = true; updateDraft();
  };
  $('songs-file').onchange = async () => {
    const file = $('songs-file').files[0], token = ++loadToken;
    draftSongs = []; $('songs-preview').replaceChildren(); $('songs-details').hidden = true; $('songs-warning').hidden = true; updateDraft();
    if (!file) { $('songs-summary').textContent = 'Cargá un TXT con una canción por línea.'; return; }
    $('songs-summary').textContent = 'Leyendo canciones…';
    try {
      if (!/\.txt$/i.test(file.name)) throw new Error('Elegí un archivo con extensión .txt.');
      const parsed = Bingo.parseSongs(await file.arrayBuffer());
      if (token !== loadToken) return;
      draftSongs = parsed.songs;
      $('songs-summary').textContent = `${draftSongs.length} canciones · ${Bingo.musicSize(draftSongs.length)} por cartón · Solo bingo completo`;
      $('songs-warning').hidden = !parsed.duplicates.length;
      $('songs-warning').textContent = parsed.duplicates.length ? `${parsed.duplicates.length} títulos repetidos: se conservarán como números distintos.` : '';
      const fragment = document.createDocumentFragment();
      draftSongs.forEach(song => fragment.append(element('li', '', song)));
      $('songs-preview').append(fragment); $('songs-details').hidden = false;
    } catch (error) { if (token === loadToken) $('songs-summary').textContent = error.message; }
    finally { if (token === loadToken) updateDraft(); }
  };
  $('expand').onclick = () => { const expanded = document.body.classList.toggle('expanded'); $('expand').textContent = expanded ? '↙ Volver a vista normal' : '⛶ Ampliar tablero'; };
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { document.body.classList.remove('expanded'); $('expand').textContent = '⛶ Ampliar tablero'; } });
  $('generate-form').onsubmit = async event => {
    event.preventDefault(); if (!writable || busy) return;
    const name = $('set-name').value.trim(), count = Number($('quantity').value);
    const mode = $('set-mode').value, songs = [...draftSongs];
    if (!name) return notice('Ingresá un nombre para el set.', true);
    if (!Number.isInteger(count) || count < 1 || count > 1000) return notice('Elegí entre 1 y 1000 cartones.', true);
    if (mode === 'music' && (!songs.length || count > Bingo.musicLimit(songs.length))) return notice('Revisá el listado y la cantidad máxima de cartones.', true);
    busy = true; controls();
    try {
      const generated = await generateInWorker(count, mode === 'music' ? songs.length : null);
      state = await BingoStorage.update(current => {
        if (current.nextCode + count >= Number.MAX_SAFE_INTEGER) throw new Error('Se alcanzó el límite de códigos.');
        const set = { id: crypto.randomUUID(), name, mode, createdAt: new Date().toISOString(), cards: generated.map(values => ({ code: current.nextCode++, ...(mode === 'music' ? { numbers: values } : { matrix: values }) })) };
        if (mode === 'music') { set.songs = songs; set.cardSize = Bingo.musicSize(songs.length); }
        current.sets.push(set); return current;
      });
      render(); notice(`${count} cartones guardados. Recordá descargar un respaldo antes de imprimir.`); $('set-name').value = '';
    } catch (error) { notice(error.message, true); }
    finally { busy = false; controls(); }
  };
  $('game-form').onsubmit = async event => {
    event.preventDefault(); const name = $('game-name').value.trim(), setId = $('game-set').value;
    if (!name) return notice('Ingresá un nombre para la partida.', true);
    const ok = await mutate(current => {
      if (!current.sets.some(s => s.id === setId)) throw new Error('Seleccioná un set válido.');
      const id = crypto.randomUUID(); current.games.push({ id, name, setId, createdAt: new Date().toISOString(), drawn: [] }); current.selectedGame = id; return current;
    }, 'La partida está lista. ¡A jugar!');
    if (ok) { $('game-dialog').close(); showView('game'); $('draw').focus(); }
  };
  $('game-select').onchange = async () => { const id = $('game-select').value; if (!await mutate(current => { current.selectedGame = id; return current; })) render(); };
  $('draw').onclick = async () => {
    if (snapshot || !game()) return;
    const id = game().id;
    await mutate(current => { const selected = current.games.find(g => g.id === id), set = current.sets.find(s => s.id === selected.setId); selected.drawn.push(Bingo.draw(selected.drawn, undefined, Bingo.totalFor(set))); return current; });
  };
  $('verify-open').onclick = () => {
    if (!writable || !game() || busy) return;
    snapshot = structuredClone(game()); controls(); $('card-code').value = ''; $('verify-result').replaceChildren();
    $('verify-context').textContent = `${snapshot.name} · ${snapshot.drawn.length} bolillas extraídas. No se sacarán números durante la verificación.`;
    $('verify-dialog').showModal(); $('card-code').focus();
  };
  $('verify-dialog').addEventListener('close', () => { snapshot = null; controls(); $('verify-open').focus(); });
  $('verify-form').onsubmit = event => {
    event.preventDefault(); const root = $('verify-result'); root.replaceChildren();
    try {
      const card = Bingo.findCard(state, snapshot, $('card-code').value), set = setFor(snapshot);
      if (set.mode === 'music') {
        const result = Bingo.verifyMusic(card.numbers, snapshot.drawn);
        root.append(ticket(card, set, snapshot.drawn));
        root.append(element('div', `result-flag${result.bingo ? ' win' : ''}`, result.bingo ? '✓ ¡Bingo válido!' : 'Bingo no válido'));
        const missing = element('div', 'missing-info');
        missing.append(element('p', '', result.bingo ? `Las ${card.numbers.length} canciones del cartón ya salieron.` : `Faltan ${result.missing.length} canciones:`));
        result.missing.forEach(n => missing.append(element('p', '', `${n} · ${set.songs[n - 1]}`)));
        root.append(missing); return;
      }
      const result = Bingo.verify(card.matrix, snapshot.drawn);
      root.append(ticket(card, setFor(snapshot), snapshot.drawn));
      const flags = element('div', 'result-flags');
      flags.append(element('div', `result-flag${result.line ? ' win' : ''}`, result.line ? `✓ Línea válida · Fila ${result.lines.join(', ')}` : 'Línea no válida'), element('div', `result-flag${result.bingo ? ' win' : ''}`, result.bingo ? '✓ ¡Bingo válido!' : 'Bingo no válido')); root.append(flags);
      const missing = element('div', 'missing-info');
      result.missingRows.forEach((row, i) => missing.append(element('div', '', `Fila ${i + 1}: ${row.length ? 'faltan ' + row.join(', ') : 'completa ✓'}`)));
      missing.append(element('p', '', result.bingo ? 'Los 15 números del cartón ya salieron.' : `Para bingo faltan ${result.missing.length}: ${result.missing.join(', ')}.`)); root.append(missing);
    } catch (error) { root.append(element('p', 'inline-error', error.message)); }
  };
  $('preview-prev').onclick = () => { previewPage--; renderPreview(); };
  $('preview-next').onclick = () => { previewPage++; renderPreview(); };
  $('print').onclick = () => { $('preview-dialog').close(); requestAnimationFrame(() => window.print()); };
  $('export').onclick = async () => {
    try { state = await BingoStorage.read(); }
    catch (error) { notice(error.message, true); return; }
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    const a = element('a'); a.href = url; a.download = `bingo90-respaldo-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notice('Respaldo descargado. Guardalo junto a los cartones.');
  };
  $('import').onclick = () => { $('import-file').value = ''; $('import-file').click(); };
  $('import-file').onchange = async () => {
    const file = $('import-file').files[0]; if (!file || !writable || busy) return;
    try {
      pendingImport = Bingo.validateState(JSON.parse(await file.text()));
      $('import-summary').textContent = `${pendingImport.sets.length} sets · ${pendingImport.games.length} partidas`; $('confirm-dialog').showModal();
    } catch (error) { pendingImport = null; notice(`No se pudo restaurar: ${error.message}`, true); }
  };
  $('confirm-import').onclick = async () => { if (!pendingImport) return; const imported = pendingImport; if (await mutate(() => imported, 'Respaldo restaurado.')) $('confirm-dialog').close(); };
  $('confirm-dialog').addEventListener('close', () => { pendingImport = null; });
  window.addEventListener('pagehide', () => releaseLock?.());
  window.addEventListener('pageshow', event => { if (event.persisted) acquireLock(); });
  async function start() {
    render();
    try { await BingoStorage.open(); state = await BingoStorage.read(); render(); acquireLock(); }
    catch (error) { notice(error.message, true); }
  }
  start();
})();
