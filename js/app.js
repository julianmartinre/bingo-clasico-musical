'use strict';
(() => {
  const $ = id => document.getElementById(id);
  let state = Bingo.emptyState(), writable = false, busy = false, snapshot = null, previewSet = null, previewPage = 0, pendingImport = null, lockPending = false;
  let releaseLock, noticeTimer;
  let draftSongs = [], folderRows = [], folderIgnored = [], folderName = '', loadToken = 0, musicPages = [], boardSetId;
  const folderSupported = 'webkitdirectory' in $('songs-folder');
  const modeName = set => set?.mode === 'music' ? 'Musical' : 'Clásico';
  const game = () => state.games.find(g => g.id === state.selectedGame);
  const setFor = g => state.sets.find(s => s.id === g?.setId);
  const audioLibrary = BingoMusicAudio.library();
  const referenceDrafts = new Map();
  const audioPlayer = BingoMusicAudio.player($('music-player'), renderAudio);
  let audioSet, audioTrigger, previewNumber = null;
  const clipDrafts = new Map(), audioMetadata = BingoMusicAudio.metadata();
  const editingSet = () => state.sets.find(set => set.id === audioSet?.id);
  const clipSummary = clip => `${Bingo.formatTime(clip.start)} → ${clip.end === null ? 'final de la canción' : Bingo.formatTime(clip.end)}`;
  function cancelClipRequests() { clipDrafts.forEach(draft => { draft.controller?.abort(); draft.working = false; }); }
  function stopPreview(number) {
    if (number === undefined || previewNumber === number) { audioPlayer.stop(); previewNumber = null; $('audio-preview-status').textContent = ''; }
  }
  function updateClipRow(number) {
    const set = editingSet(), draft = clipDrafts.get(number), row = $(`clip-row-${number}`);
    if (!set || !draft || !row) return;
    const file = audioLibrary.file(set, number), duration = audioMetadata.peek(file);
    $(`clip-saved-${number}`).textContent = `Guardado: ${clipSummary(set.clips[number - 1])}${duration ? ` · Duración: ${duration.toFixed(1)} s` : ' · Pendiente de comprobar contra el archivo'}`;
    $(`clip-error-${number}`).textContent = draft.error || (draft.working ? 'Comprobando audio…' : '');
    row.querySelectorAll('button').forEach(button => button.disabled = !writable || busy || draft.working || (button.dataset.clipAction === 'test' && !file));
  }
  async function clipAction(number, action) {
    const set = editingSet(), draft = clipDrafts.get(number);
    if (!set || !draft || !writable || busy || draft.working) return;
    if (action === 'test') {
      cancelClipRequests(); stopPreview(); previewNumber = number;
      $('audio-preview-status').textContent = `Preparando prueba ${number}…`;
      $('audio-preview-stop').disabled = false;
    }
    else if (previewNumber === number) stopPreview(number);
    draft.controller?.abort(); const controller = new AbortController(); draft.controller = controller;
    const file = audioLibrary.file(set, number);
    draft.error = ''; draft.working = true; updateClipRow(number);
    try {
      const clip = action === 'reset' ? { start: 0, end: null } : Bingo.validateClip({ start: Bingo.parseTime(draft.start), end: Bingo.parseTime(draft.end, null) });
      if (file) Bingo.validateClip(clip, await audioMetadata.read(file, controller.signal));
      if (controller.signal.aborted || editingSet()?.id !== set.id || !writable) return;
      if (action === 'test') {
        if (!file) throw new Error('Asociá un archivo para probar el fragmento.');
        audioPlayer.select(file, `preview:${set.id}:${number}`, `${number} · ${set.songs[number - 1]}`, clip);
        await audioPlayer.play();
      } else {
        const ok = await mutate(current => {
          const target = current.sets.find(item => item.id === set.id);
          if (!target || target.mode !== 'music') throw new Error('El set ya no está disponible.');
          target.clips[number - 1] = clip; return current;
        });
        if (!ok) throw new Error('No se pudo guardar el fragmento. El valor anterior se conserva; podés reintentar.');
        if (controller.signal.aborted || editingSet()?.id !== set.id) return;
        draft.start = Bingo.formatTime(clip.start); draft.end = Bingo.formatTime(clip.end);
        $(`clip-start-${number}`).value = draft.start; $(`clip-end-${number}`).value = draft.end;
      }
    } catch (error) { if (!controller.signal.aborted) draft.error = error.message; }
    finally { if (draft.controller === controller) draft.working = false; updateClipRow(number); }
  }

  function renderAudio(value = audioPlayer.read()) {
    const current = game(), set = setFor(current), musical = set?.mode === 'music';
    if (audioSet) {
      $('audio-preview-status').textContent = previewNumber ? `Prueba ${value.label || previewNumber}: ${value.message}` : '';
      $('audio-preview-stop').disabled = previewNumber === null;
    }
    $('audio-panel').hidden = !musical;
    $('audio-track').textContent = value.label;
    $('audio-status').textContent = writable ? value.message : 'Audio disponible en la pestaña que tiene el control.';
    $('audio-status').dataset.status = value.status;
    $('audio-play').textContent = ['playing', 'loading'].includes(value.status) ? 'Pausar canción' : 'Reproducir canción';
    const disabled = !writable || busy || Boolean(snapshot) || !value.hasFile;
    $('audio-play').disabled = disabled; $('audio-restart').disabled = disabled;
    $('audio-volume').disabled = !value.volumeSupported || !writable;
    $('audio-volume-help').hidden = value.volumeSupported;
    $('audio-volume').value = Math.round(value.volume * 100);
    $('audio-volume-value').textContent = `${Math.round(value.volume * 100)} %`;
    $('audio-open').disabled = !writable || busy;
  }
  function syncAudio() {
    if (audioSet) {
      if (!writable) { cancelClipRequests(); stopPreview(); audioPlayer.stop(); }
      clipDrafts.forEach((_, number) => updateClipRow(number)); renderAudio(); return;
    }
    const current = game(), set = setFor(current), number = current?.drawn.at(-1);
    if (!writable || set?.mode !== 'music' || !number) {
      if (audioPlayer.read().key) audioPlayer.stop();
    } else audioPlayer.select(audioLibrary.file(set, number), `${current.id}:${number}`, `${number} · ${set.songs[number - 1]}`, set.clips[number - 1]);
    renderAudio();
  }
  function renderAudioLinks() {
    if (!editingSet()) return;
    audioSet = editingSet();
    const files = audioLibrary.files(audioSet);
    $('audio-summary').textContent = associationSummary(audioLibrary, audioSet);
    $('audio-links').replaceChildren();
    audioSet.songs.forEach((title, index) => {
      const number = index + 1, row = element('div', 'audio-link'), label = element('label', '', `${number} · ${title}`), select = element('select');
      select.id = `audio-link-${number}`; label.htmlFor = select.id;
      select.append(new Option('Sin audio', ''));
      files.forEach((file, i) => {
        const ambiguous = files.filter(candidate => candidate.name === file.name).length > 1;
        const detail = ambiguous ? ` · #${i + 1} · ${Math.ceil(file.size / 1024)} KB · ${new Date(file.lastModified).toLocaleString()}` : '';
        select.append(new Option((file.webkitRelativePath || file.name) + detail, String(i)));
      });
      const assigned = files.indexOf(audioLibrary.file(audioSet, number)); select.value = assigned < 0 ? '' : String(assigned);
      select.onchange = () => {
        if (!writable || busy) return;
        const draft = clipDrafts.get(number); draft?.controller?.abort(); if (draft) { draft.working = false; draft.error = ''; }
        stopPreview(number);
        audioLibrary.assign(audioSet, number, select.value === '' ? -1 : Number(select.value));
        syncAudio();
        $('audio-summary').textContent = associationSummary(audioLibrary, audioSet);
        $(`reference-status-${number}`).textContent = associationText(audioLibrary.result(audioSet, number));
      };
      const saved = audioSet.clips[index];
      if (!clipDrafts.has(number)) clipDrafts.set(number, { start: Bingo.formatTime(saved.start), end: Bingo.formatTime(saved.end), error: '', working: false });
      const draft = clipDrafts.get(number), editor = element('div', 'clip-editor'); editor.id = `clip-row-${number}`;
      ['start', 'end'].forEach(part => {
        const group = element('div'), input = element('input'), caption = element('label', '', part === 'start' ? 'Inicio (min:seg)' : 'Fin opcional (min:seg)');
        input.id = `clip-${part}-${number}`; caption.htmlFor = input.id; input.value = draft[part]; input.placeholder = part === 'start' ? '00:00' : 'Hasta el final'; input.autocomplete = 'off'; input.setAttribute('aria-describedby', `clip-error-${number}`);
        input.oninput = () => { draft.controller?.abort(); draft.working = false; draft[part] = input.value; draft.error = ''; stopPreview(number); updateClipRow(number); };
        group.append(caption, input); editor.append(group);
      });
      const summary = element('p', 'clip-summary'); summary.id = `clip-saved-${number}`;
      const error = element('p', 'clip-error'); error.id = `clip-error-${number}`; error.setAttribute('role', 'status');
      const actions = element('div', 'clip-actions');
      [['save', 'Guardar fragmento'], ['reset', 'Restablecer canción completa'], ['test', 'Probar fragmento']].forEach(([action, text]) => {
        const button = element('button', 'button secondary', text); button.type = 'button'; button.dataset.clipAction = action; button.onclick = () => clipAction(number, action); actions.append(button);
      });
      editor.append(summary, error, actions); row.append(label, select, referenceEditor(audioSet, number), editor); $('audio-links').append(row); updateClipRow(number);
    });
  }
  function openAudio(set, trigger) {
    if (!writable || busy || set?.mode !== 'music') return;
    audioPlayer.pause(); clipDrafts.clear(); referenceDrafts.clear(); previewNumber = null;
    audioSet = set; audioTrigger = trigger; $('audio-files').value = '';
    $('audio-set-name').textContent = set.name; renderAudioLinks(); $('audio-dialog').showModal(); $('audio-links').scrollTop = 0;
  }
  function notice(message, error = false) {
    clearTimeout(noticeTimer); $('notice').textContent = message; $('notice').classList.toggle('error', error); $('notice').hidden = false;
    noticeTimer = setTimeout(() => $('notice').hidden = true, error ? 10000 : 5000);
  }
  function element(tag, className, text) {
    const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
  }
  function associationText(result) {
    if (result.file) return `Asociado por ${result.method}: ${result.file.webkitRelativePath || result.file.name}${result.method === 'nombre' ? ' · carpeta absoluta no comprobada' : ''}`;
    return result.status === 'ambiguous' ? 'Ambiguo: elegí el archivo correcto.' : result.status === 'no-reference' ? 'Sin referencia · sin audio por título.' : result.method === 'manual' ? 'Sin audio · elección manual.' : 'Faltante: seleccioná la carpeta o el archivo.';
  }
  function associationSummary(library, set) {
    const counts = { associated: 0, missing: 0, ambiguous: 0, 'no-reference': 0 };
    set.songs.forEach((_, i) => counts[library.result(set, i + 1).status]++);
    return `${counts.associated} con audio · ${set.songs.length - counts.associated} sin audio · ${counts.missing} faltantes · ${counts.ambiguous} ambiguos · ${counts['no-reference']} sin referencia · ${library.files(set).length} archivos locales`;
  }
  function referenceEditor(set, number) {
    const prefix = 'reference', library = audioLibrary;
    const root = element('div', 'reference-editor'), input = element('input'), label = element('label', '', 'Ruta de referencia (opcional)'), status = element('p', 'reference-status'), error = element('p', 'inline-error');
    const drafts = referenceDrafts;
    input.id = `${prefix}-${number}`; label.htmlFor = input.id; input.value = drafts.get(number) ?? set.audioRefs[number - 1] ?? '';
    input.placeholder = 'Musica/tema.mp3'; input.autocomplete = 'off';
    status.id = `${prefix}-status-${number}`; status.textContent = associationText(library.result(set, number)); status.setAttribute('role', 'status');
    error.id = `${prefix}-error-${number}`; error.setAttribute('role', 'status'); input.setAttribute('aria-describedby', error.id);
    input.oninput = () => { drafts.set(number, input.value); error.textContent = ''; };
    const actions = element('div', 'clip-actions'), save = element('button', 'button secondary', 'Guardar ruta'), automatic = element('button', 'text-button', 'Volver a asociar automáticamente');
    save.type = automatic.type = 'button'; save.dataset.referenceSave = number; automatic.dataset.referenceAuto = number;
    save.onclick = async () => {
      if (!writable || busy) return;
      try {
        const reference = Bingo.audioReference(input.value);
        {
          const ok = await mutate(current => { current.sets.find(item => item.id === set.id).audioRefs[number - 1] = reference; return current; });
          if (!ok) throw new Error('No se pudo guardar la ruta. Se conserva la anterior.');
          const target = state.sets.find(item => item.id === set.id);
          cancelClipRequests(); stopPreview(); library.automatic(target, number); referenceDrafts.delete(number);
          if (editingSet()?.id === set.id) renderAudioLinks(); syncAudio();
        }
      } catch (failure) { error.textContent = failure.message; }
    };
    automatic.onclick = () => {
      if (!writable || busy) return;
      cancelClipRequests(); stopPreview();
      library.automatic(editingSet(), number); renderAudioLinks(); syncAudio();
    };
    actions.append(save, automatic); root.append(label, input, actions, status, error); return root;
  }
  function renderFolderReview(focusId, direction) {
    const fragment = document.createDocumentFragment();
    folderRows.forEach((row, index) => {
      const group = element('div', 'folder-song'); group.dataset.rowId = row.id;
      const include = element('input'), includeLabel = element('label', 'folder-include'), number = element('span', 'folder-number');
      include.type = 'checkbox'; include.checked = row.included; include.id = `folder-include-${row.id}`;
      includeLabel.htmlFor = include.id; includeLabel.append(include, document.createTextNode('Incluir '), number);
      include.onchange = () => { if (!writable || busy) return; row.included = include.checked; updateDraft(); };
      const title = element('input'), label = element('label', '', 'Título de la canción'); title.value = row.title; title.id = `folder-title-${row.id}`; label.htmlFor = title.id;
      title.oninput = () => { if (!writable || busy) return; row.title = title.value; updateDraft(); };
      const source = element('p', 'reference-status', row.relativePath), actions = element('div', 'clip-actions');
      [-1, 1].forEach(step => {
        const button = element('button', 'button secondary', step < 0 ? '↑ Subir' : '↓ Bajar'); button.type = 'button'; button.dataset.move = step;
        button.setAttribute('aria-label', `${step < 0 ? 'Subir' : 'Bajar'} canción ${index + 1}`);
        button.onclick = () => {
          if (!writable || busy) return;
          folderRows = Bingo.moveFolderSong(folderRows, row.id, step); renderFolderReview(row.id, step);
          $('folder-announcement').textContent = `Canción movida a la posición ${folderRows.findIndex(item => item.id === row.id) + 1}.`;
        }; actions.append(button);
      });
      group.append(includeLabel, label, title, source, actions); fragment.append(group);
    });
    $('folder-review').replaceChildren(fragment); updateDraft();
    if (focusId) {
      const group = document.querySelector(`[data-row-id="${focusId}"]`), button = group.querySelector(`[data-move="${direction}"]`);
      (button.disabled ? group.querySelector('input[type=checkbox]') : button).focus();
    }
  }
  function showView(name) {
    $('game-view').hidden = name !== 'game'; $('sets-view').hidden = name !== 'sets';
    document.querySelectorAll('[data-view]').forEach(button => { const active = button.dataset.view === name; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    document.body.classList.remove('expanded');
  }
  function controls() {
    const disabled = !writable || busy;
    ['set-name', 'quantity', 'new-game', 'generate', 'import', 'game-select', 'game-set', 'confirm-import', 'set-mode', 'songs-folder'].forEach(id => $(id).disabled = disabled);
    document.querySelectorAll('#folder-review input, #folder-review button, #audio-links input, #audio-links select, .reference-editor button, #audio-files, #audio-folder').forEach(node => node.disabled = disabled);
    $('songs-folder').disabled = disabled || !folderSupported;
    $('music-card-size').disabled = disabled || !draftSongs.length || $('set-mode').value !== 'music';
    folderRows.forEach((row, i) => {
      const group = document.querySelector(`[data-row-id="${row.id}"]`); if (!group) return;
      group.querySelector('[data-move="-1"]').disabled = disabled || i === 0;
      group.querySelector('[data-move="1"]').disabled = disabled || i === folderRows.length - 1;
    });
    $('generate').disabled = disabled || ($('set-mode').value === 'music' && (!draftSongs.length || draftSongs.some(song => !song) || !validDraftSize()));
    $('new-game').disabled = disabled || !state.sets.length;
    $('draw').disabled = disabled || !game() || game().drawn.length >= Bingo.totalFor(setFor(game())) || Boolean(snapshot);
    $('verify-open').disabled = !writable || busy || !game();
    $('export').disabled = busy;
    $('lock-warning').hidden = writable;
    $('generate').textContent = busy ? 'Procesando…' : 'Generar cartones ＋';
    syncAudio();
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
      info.append(element('h3', '', set.name), element('p', '', `${modeName(set)} · ${set.cards.length} cartones · Códigos ${set.cards[0].code}–${set.cards.at(-1).code}${set.mode === 'music' ? ` · ${set.songs.length} canciones, ${set.cardSize} por cartón · ${set.cardLayout === 'grid-3x9' ? 'Grilla 3 × 9' : 'Lista anterior'}` : ''}`));
      const preview = element('button', 'button secondary', 'Ver / Imprimir'); preview.onclick = () => openPreview(set.id);
      const play = element('button', 'text-button', 'Jugar →'); play.disabled = !writable; play.onclick = () => openGame(set.id);
      row.append(element('span', 'set-icon', '▦'), info, preview, play);
      if (set.mode === 'music') { const audio = element('button', 'text-button', '♫ Audios'); audio.disabled = !writable; audio.onclick = () => openAudio(set, audio); row.append(audio); }
      $('sets-list').append(row);
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
  function generateInWorker(count, total = null, size = null) {
    return new Promise((resolve, reject) => {
      const source = `const Bingo = (${BingoFactory.toString()})(); onmessage = event => { try { const {count,total,size} = event.data; postMessage({cards: total === null ? Bingo.generateCards(count) : Bingo.generateMusicCards(total,count,size).map(numbers => ({numbers, musicMatrix: Bingo.generateMusicMatrix(numbers,total)}))}); } catch(error) { postMessage({error:error.message}); } };`;
      const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      let worker;
      const cleanup = () => { worker?.terminate(); URL.revokeObjectURL(url); };
      try {
        worker = new Worker(url);
        worker.onmessage = e => { cleanup(); e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.cards); };
        worker.onerror = () => { cleanup(); reject(new Error('No se pudo generar el set. Probá abrir la aplicación desde el servidor local.')); };
        worker.postMessage({ count, total, size });
      } catch (error) { cleanup(); reject(error); }
    });
  }
  document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => showView(button.dataset.view));
  document.querySelector('.brand').onclick = event => { event.preventDefault(); showView('game'); };
  document.querySelectorAll('[data-close]').forEach(button => button.onclick = () => $(button.dataset.close).close());
  let appearanceTrigger;
  document.querySelectorAll('[data-appearance]').forEach(button => button.onclick = () => {
    appearanceTrigger = button;
    const preference = BingoAppearance.get();
    $('appearance-mode').value = preference.mode;
    $('appearance-palette').value = preference.palette;
    $('appearance-dialog').showModal();
  });
  $('appearance-dialog').addEventListener('close', () => appearanceTrigger?.focus());
  function changeAppearance() {
    const saved = BingoAppearance.set({ mode: $('appearance-mode').value, palette: $('appearance-palette').value });
    $('appearance-status').hidden = saved;
    $('appearance-status').textContent = saved ? '' : 'No se pudo guardar la apariencia. Se aplicará durante esta sesión.';
  }
  $('appearance-mode').onchange = changeAppearance;
  $('appearance-palette').onchange = changeAppearance;
  $('audio-open').onclick = () => openAudio(setFor(game()), $('audio-open'));
  $('audio-dialog').addEventListener('close', () => {
    cancelClipRequests(); stopPreview(); audioSet = null; clipDrafts.clear(); $('audio-links').replaceChildren(); $('audio-files').value = ''; syncAudio(); audioTrigger?.focus();
  });
  $('audio-preview-stop').onclick = () => { cancelClipRequests(); stopPreview(); clipDrafts.forEach((_, n) => updateClipRow(n)); };
  ['audio-files', 'audio-folder'].forEach(id => $(id).onchange = () => {
    if (!audioSet || !writable || busy || !$(id).files.length) return;
    cancelClipRequests(); stopPreview();
    audioLibrary.add(editingSet(), $(id).files); $(id).value = ''; renderAudioLinks(); syncAudio();
  });
  $('audio-play').onclick = () => {
    if (!writable || busy || snapshot) return;
    if (['playing', 'loading'].includes(audioPlayer.read().status)) audioPlayer.pause(); else audioPlayer.play();
  };
  $('audio-restart').onclick = () => { if (writable && !busy && !snapshot) { audioPlayer.restart(); audioPlayer.play(); } };
  $('audio-volume').oninput = () => { if (writable) audioPlayer.volume(Number($('audio-volume').value) / 100); };
  $('go-sets').onclick = () => { showView('sets'); $('set-name').focus(); };
  $('new-game').onclick = () => openGame(); $('take-control').onclick = acquireLock;
  function validDraftSize() {
    const size = Number($('music-card-size').value);
    return Number.isInteger(size) && size >= 1 && size <= Math.min(15, draftSongs.length);
  }
  function updateDraft() {
    const previousTotal = draftSongs.length;
    const musical = $('set-mode').value === 'music', included = folderRows.filter(row => row.included);
    draftSongs = included.map(row => row.title.trim()); const total = draftSongs.length;
    $('music-upload').hidden = !musical; $('folder-support').hidden = folderSupported;
    document.querySelector('.sets-layout').classList.toggle('musical-preparation', musical);
    const sizeField = $('music-card-size'), maxSize = Math.min(15, total);
    sizeField.max = maxSize || 1;
    if (total !== previousTotal && total && (Number(sizeField.value) > maxSize || !previousTotal)) {
      sizeField.value = maxSize;
      $('music-size-notice').textContent = `Tamaño ajustado a ${maxSize} canciones por cartón según el listado incluido.`;
    }
    const size = Number(sizeField.value), validSize = validDraftSize();
    sizeField.setAttribute('aria-invalid', String(Boolean(total) && !validSize));
    $('music-size-error').hidden = !total || validSize;
    $('music-size-error').textContent = `Ingresá un entero entre 1 y ${maxSize}.`;
    $('music-size-help').textContent = total ? `Entre 1 y ${maxSize} · Grilla de 3 × 9 con espacios vacíos · Solo bingo completo` : 'Incluí canciones para elegir el tamaño.';
    const max = musical ? validSize ? Bingo.musicLimit(total, size) : 0 : 1000;
    $('quantity').max = max;
    if (max && Number($('quantity').value) > max) { $('quantity').value = max; $('music-size-notice').textContent += ` Cantidad ajustada: máximo ${max} cartones únicos.`; }
    $('quantity-help').textContent = musical ? validSize ? `Entre 1 y ${max} cartones únicos · ${size} canciones por cartón` : 'Primero incluí canciones de una carpeta.' : 'Entre 1 y 1000 · 15 números por cartón';
    $('print-help').textContent = musical ? 'Grilla con número y canción en cada casilla. Varios cartones por hoja A4.' : '6 cartones por hoja A4, con su código y guías de corte.';
    $('songs-summary').textContent = folderRows.length ? `${folderName} · ${total} canciones incluidas · ${folderRows.length - total} excluidas · ${folderIgnored.length} archivos ignorados` : 'Elegí una carpeta con tus canciones.';
    const duplicates = draftSongs.filter((song, i) => song && draftSongs.indexOf(song) !== i);
    $('songs-warning').hidden = !duplicates.length && !draftSongs.some(song => !song);
    $('songs-warning').textContent = draftSongs.some(song => !song) ? 'Completá los títulos vacíos de las canciones incluidas.' : duplicates.length ? 'Hay títulos repetidos. Se conservarán como canciones independientes.' : '';
    let number = 0;
    folderRows.forEach(row => {
      const group = document.querySelector(`[data-row-id="${row.id}"]`); if (!group) return;
      group.querySelector('.folder-number').textContent = row.included ? `· N.º ${++number}` : '· excluida';
      const title = group.querySelector('input:not([type=checkbox])'); title.setAttribute('aria-invalid', String(row.included && !row.title.trim()));
    });
    controls();
  }
  function clearDraft() {
    $('music-card-size').value = ''; $('music-size-notice').textContent = '';
    loadToken++; folderRows = []; folderIgnored = []; folderName = ''; draftSongs = [];
    $('songs-folder').value = ''; $('folder-review').replaceChildren(); $('folder-ignored').hidden = true; $('folder-ignored-list').replaceChildren(); $('folder-announcement').textContent = '';
  }
  $('music-card-size').oninput = () => { $('music-size-notice').textContent = ''; updateDraft(); };
  $('set-mode').onchange = () => { if (!writable || busy) return; clearDraft(); updateDraft(); };
  $('songs-folder').onchange = () => {
    if (!writable || busy || !folderSupported || !$('songs-folder').files.length) return;
    const token = ++loadToken, files = [...$('songs-folder').files]; $('songs-folder').value = '';
    try {
      const result = Bingo.folderSongs(files);
      if (token !== loadToken) return;
      if (!result.rows.length) throw new Error(`La carpeta no contiene audios válidos. ${result.ignored.length} archivos ignorados: ${[...new Set(result.ignored.map(item => item.reason))].join("; ")}. Se conserva la revisión anterior.`);
      $('music-card-size').value = Math.min(15, result.rows.length); $('music-size-notice').textContent = '';
      folderRows = result.rows; folderIgnored = result.ignored; folderName = folderRows[0].relativePath.split('/')[0];
      $('folder-ignored-list').replaceChildren(...folderIgnored.map(item => element('li', '', `${item.name}: ${item.reason}`)));
      $('folder-ignored').hidden = !folderIgnored.length; $('folder-announcement').textContent = 'Carpeta cargada. Revisá los títulos y el orden antes de generar.';
      renderFolderReview();
    } catch (error) { if (token === loadToken) notice(error.message, true); }
  };
  $('expand').onclick = () => { const expanded = document.body.classList.toggle('expanded'); $('expand').textContent = expanded ? '↙ Volver a vista normal' : '⛶ Ampliar tablero'; };
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !document.querySelector('dialog[open]')) { document.body.classList.remove('expanded'); $('expand').textContent = '⛶ Ampliar tablero'; } });
  $('generate-form').onsubmit = async event => {
    event.preventDefault(); if (!writable || busy) return;
    const name = $('set-name').value.trim(), count = Number($('quantity').value);
    const mode = $('set-mode').value, size = Number($('music-card-size').value);
    let selected = [];
    try { if (mode === 'music') selected = Bingo.folderSelection(folderRows); } catch (error) { return notice(error.message, true); }
    const songs = selected.map(row => row.title), audioRefs = selected.map(row => row.relativePath);
    let createdId;
    if (!name) return notice('Ingresá un nombre para el set.', true);
    if (!Number.isInteger(count) || count < 1 || count > 1000) return notice('Elegí entre 1 y 1000 cartones.', true);
    if (mode === 'music' && (!validDraftSize() || count > Bingo.musicLimit(songs.length, size))) return notice('Revisá el listado y la cantidad máxima de cartones.', true);
    busy = true; controls();
    try {
      const generated = await generateInWorker(count, mode === 'music' ? songs.length : null, size);
      state = await BingoStorage.update(current => {
        if (current.nextCode + count >= Number.MAX_SAFE_INTEGER) throw new Error('Se alcanzó el límite de códigos.');
        const set = { id: crypto.randomUUID(), name, mode, createdAt: new Date().toISOString(), cards: generated.map(values => ({ code: current.nextCode++, ...(mode === 'music' ? values : { matrix: values }) })) };
        createdId = set.id;
        if (mode === 'music') { set.songs = songs; set.audioRefs = audioRefs; set.clips = songs.map(() => ({ start: 0, end: null })); set.cardSize = size; set.cardLayout = 'grid-3x9'; }
        current.sets.push(set); return current;
      });
      if (mode === 'music') { const target = state.sets.find(set => set.id === createdId); audioLibrary.add(target, selected.map(row => row.file)); const files = audioLibrary.files(target); selected.forEach((row, i) => audioLibrary.assign(target, i + 1, files.indexOf(row.file))); }
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
    const ok = await mutate(current => { const selected = current.games.find(g => g.id === id), set = current.sets.find(s => s.id === selected.setId); selected.drawn.push(Bingo.draw(selected.drawn, undefined, Bingo.totalFor(set))); return current; });
    if (ok && writable && !snapshot && game()?.id === id && setFor(game())?.mode === 'music') audioPlayer.play();
  };
  $('verify-open').onclick = () => {
    if (!writable || !game() || busy) return;
    audioPlayer.pause();
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
  $('confirm-import').onclick = async () => { if (!pendingImport) return; const imported = pendingImport; if (await mutate(() => imported, 'Respaldo restaurado.')) { audioPlayer.stop(); audioLibrary.clear(); syncAudio(); $('confirm-dialog').close(); } };
  $('confirm-dialog').addEventListener('close', () => { pendingImport = null; });
  window.addEventListener('pagehide', () => { cancelClipRequests(); audioPlayer.stop(); releaseLock?.(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelClipRequests(); audioPlayer.pause(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) acquireLock(); });
  async function start() {
    render();
    try { await BingoStorage.open(); state = await BingoStorage.read(); render(); acquireLock(); }
    catch (error) { notice(error.message, true); }
  }
  start();
})();
