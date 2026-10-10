const { test } = require('node:test');
const assert = require('node:assert/strict');
const B = require('../js/domain.js');

function fixture(n = 30, k = 12) {
  const s = B.emptyState(), numbers = B.generateMusicCards(n, 1, k)[0];
  s.nextCode = 2;
  s.sets = [{ id: 's', name: 'Grilla', mode: 'music', createdAt: 'today', cardLayout: 'grid-3x9', cardSize: k,
    songs: Array.from({ length: n }, (_, i) => `Tema ${i + 1}`), clips: Array.from({ length: n }, () => ({ start: 2, end: 4 })), audioRefs: Array.from({ length: n }, (_, i) => `Carpeta/${i}.mp3`),
    cards: [{ code: 1, numbers, musicMatrix: B.generateMusicMatrix(numbers, n) }] }];
  s.games = [{ id: 'g', setId: 's', name: 'Ronda', createdAt: 'today', drawn: [1, 3] }]; s.selectedGame = 'g';
  return s;
}
test('tamaños explícitos, límites exactos y agotamiento sin duplicados', () => {
  for (const [n, k, limit] of [[1, 1, 1], [8, 8, 1], [8, 7, 8], [8, 2, 28], [30, 12, 1000], [30, 15, 1000]]) {
    assert.equal(B.musicLimit(n, k), limit);
    const cards = B.generateMusicCards(n, limit, k, () => 0n);
    assert.equal(new Set(cards.map(c => c.join(','))).size, limit);
    assert(cards.every(c => c.length === k));
    assert.throws(() => B.generateMusicCards(n, limit + 1, k));
  }
  for (const k of [undefined, null, '', 0, -1, 1.5, 16, NaN, Infinity]) assert.throws(() => B.generateMusicCards(30, 1, k));
  assert.throws(() => B.generateMusicCards(8, 1, 9));
});
test('K=1..15: 27 casillas completas, reparto equilibrado, orden y persistencia', () => {
  for (let k = 1; k <= 15; k++) for (let trial = 0; trial < 20; trial++) {
    const s = fixture(30, k), card = s.sets[0].cards[0];
    assert(B.validateMusicMatrix(card.musicMatrix, card.numbers, 30));
    assert.equal(card.musicMatrix.flat().filter(n => n === null).length, 27 - k);
    assert.deepEqual(B.validateState(JSON.parse(JSON.stringify(s))), s);
    assert(!B.verifyMusic(card.numbers, card.numbers.slice(1)).bingo);
    assert(B.verifyMusic(card.numbers, card.numbers).bingo);
  }
});
test('rechaza dimensiones, huecos, duplicados, desorden y conjuntos distintos', () => {
  const mutations = [
    c => c.musicMatrix.pop(), c => c.musicMatrix[0].pop(), c => delete c.musicMatrix[0],
    c => delete c.musicMatrix[0][0], c => delete c.numbers[0],
    c => c.musicMatrix[0][0] = 31, c => c.musicMatrix[0][0] = undefined,
    c => c.musicMatrix = Array.from({ length: 3 }, (_, i) => i === 0 ? [...c.numbers.slice(0, 9)] : [...c.numbers.slice(9), ...Array(6).fill(null)]),
    c => { const positions = c.musicMatrix.flatMap((r, ri) => r.flatMap((n, ci) => n === null ? [] : [[ri, ci]])); const [r, col] = positions[0]; c.musicMatrix[r][col] = c.numbers[1]; },
    c => c.numbers.reverse()
  ];
  for (const mutate of mutations) { const s = fixture(); mutate(s.sets[0].cards[0]); const copy = structuredClone(s); assert.throws(() => B.validateState(s)); assert.deepEqual(s, copy); }
  const s = fixture(); s.sets[0].cards.push({ ...structuredClone(s.sets[0].cards[0]), code: 2 }); s.nextCode = 3;
  s.sets[0].cards[1].musicMatrix = B.generateMusicMatrix(s.sets[0].cards[1].numbers, 30);
  assert.throws(() => B.validateState(s), /duplicados/);
});
test('migración 2–4 conserva listas de 20 canciones, códigos, referencias, clips e historial', () => {
  for (const version of [2, 3, 4]) {
    const s = fixture(120, 15), set = s.sets[0]; s.version = version;
    delete set.cardLayout; delete set.cards[0].musicMatrix;
    set.cardSize = 20; set.cards[0].numbers = Array.from({ length: 20 }, (_, i) => i + 1);
    if (version < 4) delete set.audioRefs;
    if (version < 3) delete set.clips;
    const copy = structuredClone(s), next = B.validateState(s);
    assert.deepEqual(s, copy); assert.equal(next.version, 5); assert.equal(next.sets[0].cardLayout, 'list');
    assert.deepEqual(next.sets[0].cards, set.cards); assert.equal(next.sets[0].cardSize, 20); assert.deepEqual(next.games, s.games);
    if (set.clips) assert.deepEqual(next.sets[0].clips, set.clips);
    if (set.audioRefs) assert.deepEqual(next.sets[0].audioRefs, set.audioRefs);
    s.sets[0].cardLayout = 'list'; assert.throws(() => B.validateState(s));
    delete s.sets[0].cardLayout; s.sets[0].cards[0].musicMatrix = []; assert.throws(() => B.validateState(s));
    next.sets[0].cards[0].musicMatrix = []; assert.throws(() => B.validateState(next));
  }
  const classic = B.emptyState(); classic.nextCode = 2; classic.sets = [{ id: 'c', name: 'C', mode: 'classic', createdAt: 'today', cardLayout: 'list', cards: [{ code: 1, matrix: B.generateCard() }] }];
  assert.throws(() => B.validateState(classic)); delete classic.sets[0].cardLayout; classic.sets[0].cards[0].musicMatrix = []; assert.throws(() => B.validateState(classic));
});
