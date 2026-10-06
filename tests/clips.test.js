const { test } = require('node:test');
const assert = require('node:assert/strict');
const B = require('../js/domain.js');
function oldState() {
  return { version: 2, nextCode: 2, selectedGame: 'g', sets: [{ id: 's', mode: 'music', name: 'Set', createdAt: '2026-10-06', songs: ['Don', 'Don'], cardSize: 1, cards: [{ code: 1, numbers: [1] }] }], games: [{ id: 'g', name: 'Ronda', setId: 's', createdAt: '2026-10-06', drawn: [1] }] };
}
test('migración pura 2→3 y respaldos válidos', () => {
  const before = oldState(), copy = structuredClone(before), next = B.validateState(before);
  assert.deepEqual(before, copy); assert.equal(next.version, 3);
  assert.deepEqual(next.sets[0].clips, [{ start: 0, end: null }, { start: 0, end: null }]);
  const { clips, ...set } = next.sets[0]; assert.deepEqual(set, before.sets[0]); assert.deepEqual(next.games, before.games);
  next.sets[0].clips[1] = { start: 45, end: 75 }; assert.deepEqual(B.validateState(JSON.parse(JSON.stringify(next))), next);
});
test('rechaza intervalos incompletos, inseguros, fuera de contrato y arrays con huecos', () => {
  const valid = B.validateState(oldState());
  for (const clips of [[], [null, null], [{ start: 0 }, { start: 0, end: null }], [{ start: -1, end: null }, { start: 0, end: null }], [{ start: 2, end: 2 }, { start: 0, end: null }], new Array(2)]) {
    const copy = structuredClone(valid); copy.sets[0].clips = clips; assert.throws(() => B.validateState(copy));
  }
  const old = oldState(); old.sets[0].clips = valid.sets[0].clips; assert.throws(() => B.validateState(old));
  const classic = { version: 3, nextCode: 2, selectedGame: null, games: [], sets: [{ id: 'c', mode: 'classic', name: 'C', createdAt: 'today', cards: [{ code: 1, matrix: B.generateCard() }], clips: [] }] };
  assert.throws(() => B.validateState(classic));
});
test('minutos:segundos, vacíos, límites seguros y duración', () => {
  assert.equal(B.parseTime(''), 0); assert.equal(B.parseTime('', null), null); assert.equal(B.parseTime('00:59'), 59); assert.equal(B.parseTime('01:00'), 60); assert.equal(B.formatTime(75), '01:15');
  for (const text of ['-1:00', '00:75', '1.5', '00:1', '999999999999999999:00']) assert.throws(() => B.parseTime(text));
  assert.deepEqual(B.validateClip({ start: 45, end: 75 }, 75), { start: 45, end: 75 });
  assert.deepEqual(B.validateClip({ start: 0, end: null }, 2), { start: 0, end: null });
  for (const clip of [{ start: 75, end: null }, { start: 0, end: 76 }, { start: 4, end: 3 }, { start: NaN, end: null }, { start: Infinity, end: null }, { start: 1.5, end: null }]) assert.throws(() => B.validateClip(clip, 75));
});
