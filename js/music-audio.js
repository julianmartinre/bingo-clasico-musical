/* Audios temporales: no escribe en el estado del juego ni realiza solicitudes de red. */
'use strict';
const BingoMusicAudio = (() => {
  const normalize = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/g, ' ');
  const filename = file => normalize(file.name.replace(/\.[^.]+$/, ''));
  function library() {
    const sets = new Map();
    function get(set) {
      if (!sets.has(set.id)) sets.set(set.id, { files: [], links: new Map() });
      return sets.get(set.id);
    }
    return {
      files: set => [...get(set).files],
      file: (set, number) => get(set).links.get(number) || null,
      assign(set, number, index) {
        if (!Number.isInteger(number) || number < 1 || number > set.songs.length) return;
        const data = get(set), file = data.files[index];
        // Una desvinculación explícita tampoco se vuelve a asociar al agregar archivos.
        data.links.set(number, file || null);
      },
      add(set, files) {
        const data = get(set);
        for (const file of files) {
          if (!data.files.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) data.files.push(file);
        }
        const titles = set.songs.map(normalize);
        titles.forEach((title, i) => {
          if (data.links.has(i + 1) || titles.filter(t => t === title).length !== 1) return;
          const matches = data.files.filter(file => filename(file) === title);
          if (matches.length === 1) data.links.set(i + 1, matches[0]);
        });
      },
      clear: () => sets.clear()
    };
  }
  const domain = typeof module !== 'undefined' ? require('./domain.js') : Bingo;
  function waitMedia(audio, event, ready, signal) {
    if (signal.aborted) return Promise.reject(new DOMException('Cancelado', 'AbortError'));
    if (ready()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const cleanup = () => { clearTimeout(timer); audio.removeEventListener(event, done); audio.removeEventListener('error', fail); signal.removeEventListener('abort', cancel); };
      const done = () => { if (ready()) { cleanup(); resolve(); } };
      const fail = () => { cleanup(); reject(new Error('No se pudo leer o posicionar el audio. Revisá el archivo.')); };
      const cancel = () => { cleanup(); reject(new DOMException('Cancelado', 'AbortError')); };
      const timer = setTimeout(fail, 8000);
      audio.addEventListener(event, done); audio.addEventListener('error', fail); signal.addEventListener('abort', cancel);
      if (audio.error) fail();
    });
  }
  function metadata(createAudio = () => document.createElement('audio'), urls = URL) {
    const cache = new WeakMap();
    return {
      peek: file => file && cache.get(file),
      async read(file, signal) {
        if (signal.aborted) throw new DOMException('Cancelado', 'AbortError');
        if (cache.has(file)) return cache.get(file);
        const audio = createAudio(), url = urls.createObjectURL(file);
        try {
          audio.preload = 'metadata'; audio.src = url;
          const pending = waitMedia(audio, 'loadedmetadata', () => audio.readyState >= 1, signal);
          audio.load(); await pending;
          if (!Number.isFinite(audio.duration) || audio.duration <= 0) throw new Error('No se pudo determinar la duración del audio.');
          cache.set(file, audio.duration); return audio.duration;
        } finally { audio.removeAttribute('src'); audio.load(); urls.revokeObjectURL(url); }
      }
    };
  }
  function player(audio, notify = () => {}, urls = URL) {
    let source = null, url = null, key = null, label = '', status = 'empty', wanted = false;
    let clip = { start: 0, end: null }, fresh = true, detail = '', controller = new AbortController(), timer;
    let volumeSupported = true;
    try { audio.volume = 0.5; volumeSupported = Math.abs(audio.volume - 0.5) < 0.01; } catch (_) { volumeSupported = false; }
    const messages = {
      empty: 'Sorteá una canción para reproducirla.', missing: 'Sin audio para esta canción.',
      loading: 'Preparando fragmento…', playing: 'Reproduciendo', paused: 'En pausa', ended: 'El fragmento terminó.',
      blocked: 'El navegador requiere un clic en Reproducir.', error: 'No se pudo reproducir este archivo. Revisá el formato o elegí otro audio.'
    };
    const read = () => ({ key, label, status, clip: { ...clip }, message: detail || messages[status], hasFile: Boolean(source), volumeSupported, volume: audio.volume });
    function publish(next, message = '') { status = next; detail = message; notify(read()); }
    function invalidate() { controller.abort(); controller = new AbortController(); clearTimeout(timer); wanted = false; }
    function unload() {
      invalidate(); source = null; key = null;
      audio.pause(); audio.removeAttribute('src'); audio.load();
      if (url) urls.revokeObjectURL(url); url = null;
    }
    const current = () => source && url && audio.currentSrc === url;
    const limit = () => clip.end === null ? audio.duration : clip.end;
    function finish() { invalidate(); audio.pause(); fresh = true; publish('ended'); }
    function scheduleEnd() {
      clearTimeout(timer);
      if (!current() || !wanted || audio.paused) return;
      const remaining = limit() - audio.currentTime;
      if (remaining <= 0) { finish(); return; }
      // Recalcular con el reloj del medio también durante interrupciones de carga.
      timer = setTimeout(scheduleEnd, Math.min(100, Math.max(10, remaining * 1000)));
    }
    audio.addEventListener('timeupdate', scheduleEnd);
    audio.addEventListener('playing', () => { if (current() && wanted && !audio.paused) { publish('playing'); scheduleEnd(); } });
    audio.addEventListener('pause', () => { if (current() && audio.paused && status === 'playing') { invalidate(); publish('paused'); } });
    audio.addEventListener('ended', () => { if (current() && audio.ended) finish(); });
    audio.addEventListener('error', () => { if (current() && audio.error) { invalidate(); audio.pause(); publish('error'); } });
    return {
      read,
      select(file, identity, title, interval = { start: 0, end: null }) {
        if (identity === key && file === source && interval.start === clip.start && interval.end === clip.end) return;
        unload(); key = identity; label = title || ''; source = file; clip = { ...interval }; fresh = true;
        if (!identity) { publish('empty'); return; }
        if (!file) { publish('missing'); return; }
        try { domain.validateClip(clip); url = urls.createObjectURL(file); audio.src = url; publish('paused'); }
        catch (error) { publish('error', error.message); }
      },
      async play() {
        if (!source || !url) return;
        invalidate(); const signal = controller.signal; wanted = true; publish('loading');
        try {
          if (audio.readyState < 1) {
            audio.preload = 'metadata';
            const pending = waitMedia(audio, 'loadedmetadata', () => audio.readyState >= 1, signal);
            audio.load(); await pending;
          }
          if (signal.aborted) return;
          domain.validateClip(clip, audio.duration);
          if (fresh || audio.ended || audio.currentTime < clip.start || audio.currentTime >= limit()) {
            audio.currentTime = clip.start;
            await waitMedia(audio, 'seeked', () => !audio.seeking && Math.abs(audio.currentTime - clip.start) < .05, signal);
            fresh = false;
          }
          if (signal.aborted) return;
          await audio.play();
          if (!signal.aborted && wanted) { publish(audio.paused ? 'paused' : 'playing'); scheduleEnd(); }
        } catch (error) {
          if (signal.aborted) return;
          wanted = false; clearTimeout(timer); audio.pause();
          publish(error.name === 'NotAllowedError' ? 'blocked' : 'error', error.name === 'NotAllowedError' ? '' : error.message);
        }
      },
      pause() { invalidate(); audio.pause(); if (source) publish('paused'); },
      restart() { invalidate(); audio.pause(); fresh = true; if (source) { try { audio.currentTime = clip.start; } catch (_) {} publish('paused'); } },
      volume(value) {
        const next = Math.max(0, Math.min(1, Number(value)));
        if (!Number.isFinite(next)) return;
        try { audio.volume = next; volumeSupported = Math.abs(audio.volume - next) < 0.01; } catch (_) { volumeSupported = false; }
        notify(read());
      },
      stop() { unload(); label = ''; publish('empty'); }
    };
  }
  return { library, player, metadata, normalize };
})();
if (typeof module !== 'undefined') module.exports = BingoMusicAudio;
