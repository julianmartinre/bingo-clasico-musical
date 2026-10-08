const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../js/domain.js');
const encode = text => new TextEncoder().encode(text);
function fixture() {
  const state = B.emptyState();
  state.sets.push({ id: 'music', mode: 'music', name: 'Canciones', createdAt: '2026-10-05', songs: Array.from({ length: 30 }, (_, i) => `Canción ${i + 1}`), cardSize: 5, audioRefs: Array(30).fill(null), clips: Array.from({ length: 30 }, () => ({ start: 0, end: null })), cards: [{ code: 1, numbers: [1, 2, 3, 4, 5] }] });
  state.games.push({ id: 'game', name: 'Musical', createdAt: '2026-10-05', setId: 'music', drawn: [1, 2] });
  state.selectedGame = 'game'; state.nextCode = 2; return state;
}
test('tamaños y cantidades posibles', () => {
  for (const [n, k] of [[1, 1], [2, 1], [30, 5], [31, 5], [60, 10], [90, 15], [120, 20]]) assert.equal(B.musicSize(n), k);
  assert.equal(B.musicLimit(1), 1); assert.equal(B.musicLimit(2), 2); assert.equal(B.musicLimit(30), 1000);
  assert.throws(() => B.generateMusicCards(2, 3)); assert.throws(() => B.generateMusicCards(0, 1));
});
test('espacio completo sin reintentos y combinaciones correctas', () => {
  for (let n = 1; n <= 11; n++) {
    const cards = B.generateMusicCards(n, n, () => 0n);
    assert.deepEqual(cards.map(c => c[0]).sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1));
  }
  const cards = B.generateMusicCards(12, 66, () => 0n);
  assert.equal(new Set(cards.map(c => c.join(','))).size, 66);
  assert(cards.every(c => c.length === 2 && c[0] >= 1 && c[1] <= 12 && c[0] < c[1]));
});
test('1000 cartones musicales únicos de 30 y 120 canciones', () => {
  for (const n of [30, 120]) {
    const cards = B.generateMusicCards(n, 1000);
    assert.equal(cards.length, 1000); assert.equal(new Set(cards.map(c => c.join(','))).size, 1000);
    assert(cards.every(c => c.length === B.musicSize(n) && c.every((value, i) => value >= 1 && value <= n && (!i || value > c[i - 1]))));
  }
});
test('sorteo de 2, 30 y 120 números; cada índice selecciona una bolilla restante', () => {
  for (const total of [2, 30, 120]) {
    const drawn = [];
    for (let i = 0; i < total; i++) drawn.push(B.draw(drawn, length => length - 1, total));
    assert.equal(new Set(drawn).size, total); assert.equal(drawn[0], total); assert.equal(drawn.at(-1), 1);
    assert.throws(() => B.draw(drawn, undefined, total));
  }
  assert.deepEqual([0, 1, 2].map(i => B.draw([2, 4], () => i, 5)), [1, 3, 5]);
});
test('verificación solo bingo, falta una canción y varios ganadores', () => {
  assert.deepEqual(B.verifyMusic([1, 2, 3, 4, 5], [1, 2, 3, 4]), { bingo: false, missing: [5] });
  assert.deepEqual(B.verifyMusic([1, 2], [1, 2, 3]), { bingo: true, missing: [] });
  assert(B.verifyMusic([2, 3], [1, 2, 3]).bingo);
});
test('datos mixtos, normalización pura y validación musical estricta', () => {
  const old = { version: 1, nextCode: 10, selectedGame: 'classic-game', sets: [{ id: 'classic', name: 'Anterior', createdAt: '2026-09-30', cards: [{ code: 9, matrix: B.generateCard() }] }], games: [{ id: 'classic-game', name: 'Ronda', setId: 'classic', createdAt: '2026-09-30', drawn: [90, 1] }] };
  const backup = structuredClone(old), normalized = B.validateState(old);
  assert.deepEqual(old, backup); assert.equal(normalized.version, 4); assert.equal(normalized.sets[0].mode, 'classic');
  assert.deepEqual(normalized.games, old.games); assert.deepEqual(normalized.sets[0].cards, old.sets[0].cards); assert.equal(normalized.nextCode, 10);
  const mixed = fixture(); mixed.sets.push(normalized.sets[0]); mixed.games.push(normalized.games[0]); mixed.nextCode = 10;
  assert.deepEqual(B.validateState(JSON.parse(JSON.stringify(mixed))), mixed);
  const mutations = [s => s.sets[0].songs = [], s => s.sets[0].cardSize = 6, s => s.sets[0].cards[0].numbers = [1, 2, 3, 4, 31], s => s.sets[0].cards[0].numbers = [1, 2, 3, 4, 4], s => s.games[0].drawn = [31], s => s.sets[0].mode = 'unknown', s => s.sets[0].cards.push({ code: 2, numbers: [1, 2, 3, 4, 5] })];
  for (const mutate of mutations) { const state = fixture(); mutate(state); assert.throws(() => B.validateState(state)); }
});
