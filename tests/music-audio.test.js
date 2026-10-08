const { test } = require('node:test');
const assert = require('node:assert/strict');
const A = require('../js/music-audio.js');
const file = (name, size = 100, lastModified = 1) => ({ name, size, lastModified });
test('asociación única, normalización, títulos repetidos y archivos homónimos', () => {
  const lib = A.library(), set = { id: 'a', songs: [' Canción   Uno ', 'Don', 'Don', 'Otro', '01 Tema'] };
  lib.add(set, [file('CANCION UNO.mp3'), file('Don.mp3'), file('Otro.mp3'), file('Otro.wav'), file('Tema.mp3')]);
  assert.equal(lib.file(set, 1).name, 'CANCION UNO.mp3');
  for (const number of [2, 3, 4, 5]) assert.equal(lib.file(set, number), null);
  lib.assign(set, 2, 1); lib.assign(set, 3, 1); assert.equal(lib.file(set, 2), lib.file(set, 3));
  lib.add(set, [file('Don.mp3'), file('Don.mp3', 101)]); assert.equal(lib.files(set).length, 7);
  assert.equal(lib.file(set, 2).size, 100);
  lib.assign(set, 1, -1); lib.add(set, [file('Otra.mp3')]); assert.equal(lib.file(set, 1), null);
  assert.equal(lib.files({ id: 'b', songs: [] }).length, 0);
  lib.clear(); assert.equal(lib.files(set).length, 0);
});
class Media extends EventTarget {
  constructor() { super(); this.volume = 1; this.paused = true; this.currentTime = 0; this.currentSrc = ''; this.readyState = 1; this.duration = 100; this.seeking = false; }
  set src(value) { this.currentSrc = value; }
  removeAttribute() { this.currentSrc = ''; }
  load() {}
  pause() { this.paused = true; this.dispatchEvent(new Event('pause')); }
  play() { this.paused = false; this.dispatchEvent(new Event('playing')); return Promise.resolve(); }
}
function setup(media = new Media()) {
  const revoked = [], values = []; let id = 0;
  const p = A.player(media, v => values.push(v), { createObjectURL: () => `blob:${++id}`, revokeObjectURL: url => revoked.push(url) });
  return { p, media, revoked, values };
}
test('fuente única, controles, fin y liberación', async () => {
  const { p, media, revoked } = setup();
  p.select(file('A.mp3'), 'a:1', '1 · A'); await p.play(); assert.equal(p.read().status, 'playing');
  p.pause(); assert.equal(p.read().status, 'paused'); media.currentTime = 5; p.restart(); assert.equal(media.currentTime, 0);
  p.volume(.2); assert.equal(media.volume, .2);
  p.select(file('B.mp3'), 'a:2', '2 · B'); assert.deepEqual(revoked, ['blob:1']); assert(media.paused);
  await p.play(); media.ended = true; media.dispatchEvent(new Event('ended')); assert.equal(p.read().status, 'ended');
  p.select(null, 'a:3', '3 · C'); assert.equal(p.read().status, 'missing'); assert(media.paused); assert.equal(revoked.length, 2);
  p.stop(); assert.equal(p.read().status, 'empty'); assert.equal(media.currentSrc, '');
});
test('rechazo tardío no contamina otra pista; pausa invalida play pendiente', async () => {
  const { p, media } = setup(); let reject, resolve;
  media.play = () => new Promise((ok, no) => { resolve = ok; reject = no; });
  p.select(file('A'), '1', 'A'); const pending = p.play(); await Promise.resolve();
  p.select(file('B'), '2', 'B'); reject({ name: 'NotAllowedError' }); await pending;
  assert.equal(p.read().status, 'paused'); assert.equal(p.read().key, '2');
  const next = p.play(); await Promise.resolve(); p.pause(); resolve(); await next; assert.equal(p.read().status, 'paused');
});
test('bloqueos y errores se recuperan sin cambiar selección', async () => {
  const { p, media } = setup(); p.select(file('A'), '1', 'A');
  media.play = () => Promise.reject({ name: 'NotAllowedError' }); await p.play(); assert.equal(p.read().status, 'blocked');
  media.play = () => Promise.reject({ name: 'NotSupportedError' }); await p.play(); assert.equal(p.read().status, 'error');
  media.play = Media.prototype.play; await p.play(); assert.equal(p.read().status, 'playing'); assert.equal(p.read().key, '1');
  media.error = {}; media.dispatchEvent(new Event('error')); assert.equal(p.read().status, 'error'); assert(media.paused);
});
test('volumen restringido', () => {
  const media = new Media(); Object.defineProperty(media, 'volume', { get: () => 1, set: () => {} });
  const { p } = setup(media); assert.equal(p.read().volumeSupported, false); p.volume(.2); assert.equal(p.read().volumeSupported, false);
});

test('fragmento: espera metadatos, busca antes de play y cancela cargas anteriores', async () => {
  const { p, media } = setup(); let playedAt;
  media.readyState = 0;
  media.play = () => { playedAt = media.currentTime; return Media.prototype.play.call(media); };
  p.select(file('A'), '1', 'A', { start: 2, end: 4 });
  const pending = p.play(); assert.equal(playedAt, undefined);
  media.readyState = 1; media.duration = 6; media.dispatchEvent(new Event('loadedmetadata'));
  await pending; assert.equal(playedAt, 2);
  media.currentTime = 4.02; media.dispatchEvent(new Event('timeupdate')); assert(media.paused); assert.equal(p.read().status, 'ended');
  await p.play(); assert.equal(playedAt, 2); p.pause();
  media.readyState = 0; playedAt = undefined; p.select(file('B'), '2', 'B', { start: 1, end: 3 });
  const loading = p.play(); p.select(file('C'), '3', 'C');
  media.readyState = 1; media.dispatchEvent(new Event('loadedmetadata')); await loading;
  assert.equal(playedAt, undefined); assert.equal(p.read().key, '3'); p.stop();
});

test('intervalo fuera del archivo no se reproduce ni se corrige silenciosamente', async () => {
  const { p, media } = setup(); let plays = 0; media.duration = 3;
  media.play = () => { plays++; return Promise.resolve(); };
  p.select(file('A'), '1', 'A', { start: 2, end: 4 }); await p.play();
  assert.equal(plays, 0); assert.equal(p.read().status, 'error'); assert.match(p.read().message, /no cabe/);
  p.stop();
});

test('metadatos bajo demanda se cachean por archivo y liberan URLs al cancelar', async () => {
  let created = 0; const revoked = [], media = new Media(); media.readyState = 0;
  const metadata = A.metadata(() => { created++; return media; }, { createObjectURL: () => 'blob:meta', revokeObjectURL: u => revoked.push(u) });
  const f = file('A'), controller = new AbortController();
  assert.equal(created, 0); const pending = metadata.read(f, controller.signal); controller.abort();
  await assert.rejects(pending, { name: 'AbortError' }); assert.equal(revoked.length, 1);
  media.readyState = 1; media.duration = 6;
  assert.equal(await metadata.read(f, new AbortController().signal), 6);
  assert.equal(await metadata.read(f, new AbortController().signal), 6); assert.equal(created, 2); assert.equal(revoked.length, 2);
});
