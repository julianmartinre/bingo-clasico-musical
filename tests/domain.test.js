'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../js/domain.js');
const matrix = [
  [1, 10, 20, 30, 40, null, null, null, null],
  [2, 11, null, null, null, 50, 60, 70, null],
  [3, null, 21, null, null, 51, 61, null, 90]
];
function fixture() {
  return { version: 1, nextCode: 2, selectedGame: 'game', sets: [{ id: 'set', name: 'Prueba', createdAt: '2026-09-30', cards: [{ code: 1, matrix }] }], games: [{ id: 'game', name: 'Ronda', createdAt: '2026-09-30', setId: 'set', drawn: [] }] };
}
test('tres sets de 1000: invariantes de filas, columnas, rangos y unicidad', () => {
  for (let i = 0; i < 3; i++) {
    const cards = B.generateCards(1000);
    assert.equal(cards.length, 1000); cards.forEach(card => assert.equal(B.validateCard(card), true));
    assert.equal(new Set(cards.map(B.fingerprint)).size, 1000);
  }
});
test('cantidad inválida y reintentos agotados no devuelven un set parcial', () => {
  for (const count of [0, -1, 1.5, 1001, NaN]) assert.throws(() => B.generateCards(count));
  assert.throws(() => B.generateCards(2, () => 0, 3), /No se pudo completar/);
  assert.equal(B.generateCards(1).length, 1);
});
test('90 extracciones sin repetición y agotamiento', () => {
  const drawn = [];
  for (let i = 0; i < 90; i++) drawn.push(B.draw(drawn));
  assert.equal(new Set(drawn).size, 90);
  assert.deepEqual([...drawn].sort((a, b) => a - b), Array.from({ length: 90 }, (_, i) => i + 1));
  assert.throws(() => B.draw(drawn), /agotado/);
});
test('línea, aciertos repartidos, 14 aciertos, bingo y casillas vacías', () => {
  assert(B.validateCard(matrix));
  assert.equal(B.verify(matrix, []).line, false);
  assert.equal(B.verify(matrix, [1, 10, 20, 2, 3]).line, false);
  const line = B.verify(matrix, [2, 11, 50, 60, 70]); assert.deepEqual(line.lines, [2]); assert.equal(line.bingo, false);
  const numbers = matrix.flat().filter(n => n !== null);
  const almost = B.verify(matrix, numbers.filter(n => n !== 90)); assert.equal(almost.bingo, false); assert.deepEqual(almost.missing, [90]);
  const full = B.verify(matrix, numbers); assert.equal(full.bingo, true); assert.deepEqual(full.lines, [1, 2, 3]);
  const other = B.generateCard(); const all = Array.from({ length: 90 }, (_, i) => i + 1);
  assert(B.verify(other, all).bingo && B.verify(matrix, all).bingo);
});
test('respaldo válido se copia y se conserva sin cambios', () => {
  const state = fixture(); state.games[0].drawn = [2, 11, 50, 60, 70];
  const restored = B.validateState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, { ...state, version: 4, sets: state.sets.map(set => ({ ...set, mode: 'classic' })) }); assert.notEqual(restored, state);
  assert.deepEqual(B.verify(restored.sets[0].cards[0].matrix, restored.games[0].drawn).lines, [2]);
});
test('rechaza versiones, códigos, matrices, partidas y bolillas inválidas', () => {
  const mutations = [s => s.version = 99, s => s.nextCode = 1, s => s.sets[0].cards.push(s.sets[0].cards[0]), s => s.sets[0].cards[0].matrix[0][0] = 90, s => s.games[0].setId = 'missing', s => s.games[0].drawn = [1, 1], s => s.games[0].drawn = [91], s => s.selectedGame = 'missing', s => s.games.push(s.games[0]), s => s.sets[0].cards.push({ code: 2, matrix: structuredClone(matrix) })];
  for (const mutate of mutations) { const state = structuredClone(fixture()); mutate(state); assert.throws(() => B.validateState(state)); }
});
test('búsqueda: espacios, desconocido, formato inválido, otro set y sin partida', () => {
  const state = fixture(), game = state.games[0];
  assert.equal(B.findCard(state, game, ' 1 ').code, 1);
  assert.throws(() => B.findCard(state, game, '2'), /No se encontró/);
  for (const code of ['01', '-1', 'a', '', '1.0', '1e0']) assert.throws(() => B.findCard(state, game, code), /válido/);
  assert.throws(() => B.findCard(state, { ...game, setId: 'other' }, '1'), /otro set/);
  assert.throws(() => B.findCard(state, null, '1'), /Seleccioná/);
});

