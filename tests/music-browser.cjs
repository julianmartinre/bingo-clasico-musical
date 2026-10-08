/* Integración opcional con Playwright del entorno de QA, sin dependencias de la app. */
const { chromium } = require(process.env.BINGO_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const B = require('../js/domain.js');
const out = path.join(__dirname, 'artifacts', 'music'); fs.mkdirSync(out, { recursive: true });
const url = 'http://127.0.0.1:8080';
let browser;
const ready = page => page.waitForFunction(() => document.getElementById('lock-warning').hidden);
const state = page => page.evaluate(() => BingoStorage.read());
async function rawState(page, value) {
  return page.evaluate(value => new Promise((resolve, reject) => {
    const request = indexedDB.open('bingo90', 1);
    request.onsuccess = () => {
      const db = request.result, tx = db.transaction('state', value ? 'readwrite' : 'readonly');
      const req = value ? tx.objectStore('state').put(value, 'current') : tx.objectStore('state').get('current');
      tx.oncomplete = () => { db.close(); resolve(value || req.result); }; tx.onerror = () => reject(tx.error);
    };
  }), value);
}
const {uploadSongs}=require('./folder-fixture.cjs');
async function generate(page, name, songs, count = 3) {
  await page.locator('[data-view="sets"]').click(); await page.locator('#set-mode').selectOption('music');
  await uploadSongs(page, songs); await page.locator('#set-name').fill(name); await page.locator('#quantity').fill(String(count)); await page.locator('#generate').click();
  await page.waitForFunction(name => [...document.querySelectorAll('.set-info h3')].some(node => node.textContent === name), name);
  await page.waitForFunction(() => !document.getElementById('generate').disabled);
}
async function play(page, name) {
  await page.locator('.set-row').filter({ has: page.getByRole('heading', { name, exact: true }) }).getByRole('button', { name: 'Jugar →' }).click();
  await page.locator('#game-form button[type=submit]').click(); await page.waitForFunction(() => !document.getElementById('game-dialog').open);
}
async function verify(page, code) {
  await page.locator('#verify-open').click(); await page.locator('#card-code').fill(String(code)); await page.locator('#verify-form button').click();
  return page.locator('#verify-result').textContent();
}
async function restore(page, value, cancel = false) {
  await page.locator('[data-view="sets"]').click();
  await page.locator('#import-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value)) });
  await page.locator('#confirm-dialog').waitFor({ state: 'visible' });
  await page.locator(cancel ? '[data-close="confirm-dialog"]' : '#confirm-import').click();
  await page.waitForFunction(() => !document.getElementById('confirm-dialog').open);
}
(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage(), errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', req => { if (!req.url().startsWith(url) && !/^(blob:|data:)/.test(req.url())) external.push(req.url()); });
  await page.goto(url); await ready(page);
  const legacy = { version: 1, nextCode: 2, selectedGame: 'old-game', sets: [{ id: 'old-set', name: 'Clásico anterior', createdAt: '2026-09-30', cards: [{ code: 1, matrix: B.generateCard() }] }], games: [{ id: 'old-game', name: 'Partida anterior', createdAt: '2026-09-30', setId: 'old-set', drawn: [2, 90] }] };
  await rawState(page, legacy); await page.reload(); await ready(page);
  assert.deepEqual(await rawState(page), legacy); assert.deepEqual(await state(page), B.validateState(legacy));
  await page.locator('#draw').click(); await page.waitForFunction(() => document.getElementById('draw-count').textContent === '3');
  assert.equal((await rawState(page)).version, 4); assert.equal(await page.locator('.number-cell').count(), 90);
  await page.locator('[data-view="sets"]').click(); await page.locator('#set-mode').selectOption('music');
  await uploadSongs(page, ['Pasos al costado','Don','Don','<img src=x>']);
  assert.equal(await page.locator('.folder-song').count(),4);assert.equal(await page.locator('#folder-review img').count(),0);
  assert(!(await page.locator('#songs-warning').isHidden()));assert.equal(await page.locator('#quantity').getAttribute('max'),'4');
  await page.locator('.folder-song input:not([type=checkbox])').first().fill('');assert(await page.locator('#generate').isDisabled());
  const songs = ['Pasos al costado', 'Don', ...Array.from({ length: 28 }, (_, i) => `Canción ${i + 3}`)];
  await generate(page, 'Bingo musical del sábado', songs);
  let saved = await state(page), set = saved.sets.at(-1);
  assert.equal(set.cardSize, 5); assert.equal(set.cards[0].code, 2); assert.deepEqual(set.songs, songs);
  await uploadSongs(page, [...songs].reverse()); assert.deepEqual((await state(page)).sets.at(-1).songs, songs);
  await page.screenshot({ path: path.join(out, '01-sets.png'), fullPage: true });
  // Un fallo de worker no persiste ni reserva códigos.
  const beforeFailure = await state(page);
  await page.evaluate(() => { window.OriginalWorker = Worker; window.Worker = class { constructor() { throw new Error('Fallo simulado de worker'); } }; });
  await page.locator('#set-name').fill('Fallo'); await page.locator('#generate').click();
  await page.waitForFunction(() => !document.getElementById('generate').disabled);
  assert.deepEqual(await state(page), beforeFailure);
  await page.evaluate(() => { window.Worker = window.OriginalWorker; });
  await play(page, set.name);
  assert.equal(await page.locator('.number-cell').count(), 30);
  await page.locator('#board button').first().hover(); assert.equal(await page.locator('#song-detail').textContent(), '1 · Pasos al costado');
  await page.locator('#board button').nth(1).focus(); assert.equal(await page.locator('#song-detail').textContent(), '2 · Don');
  await page.locator('#board button').nth(1).click(); assert.equal(await page.locator('#draw-count').textContent(), '0');
  await page.keyboard.press('Escape'); assert(await page.locator('#song-detail').isHidden());
  await page.locator('#draw').click(); await page.waitForFunction(() => document.getElementById('draw-count').textContent === '1');
  const first = (await state(page)).games.at(-1).drawn[0]; assert.equal(await page.locator('#last-song').textContent(), songs[first - 1]);
  await page.locator('#history button').first().focus(); assert((await page.locator('#song-detail').textContent()).includes(songs[first - 1]));
  await page.screenshot({ path: path.join(out, '02-sorteo.png'), fullPage: true });
  await page.reload(); await ready(page); assert.equal(await page.locator('#last-song').textContent(), songs[first - 1]);
  saved = await state(page); saved.games.at(-1).drawn = set.cards[0].numbers.slice(0, 4);
  await restore(page, saved); await page.locator('[data-view="game"]').click();
  const invalid = await verify(page, set.cards[0].code); assert(invalid.includes('Bingo no válido')); assert(!/línea/i.test(invalid)); assert(invalid.includes(songs[set.cards[0].numbers[4] - 1]));
  assert(await page.locator('#draw').isDisabled()); await page.locator('[data-close="verify-dialog"]').last().click();
  saved.games.at(-1).drawn = [...set.cards[0].numbers]; await restore(page, saved); await page.locator('[data-view="game"]').click();
  assert((await verify(page, set.cards[0].code)).includes('¡Bingo válido!'));
  await page.screenshot({ path: path.join(out, '03-bingo.png'), fullPage: true });
  await page.locator('[data-close="verify-dialog"]').last().click();
  await page.locator('#game-select').selectOption('old-game'); await page.waitForFunction(() => document.querySelectorAll('.number-cell').length === 90);
  assert(await page.locator('#last-song').isHidden()); assert(/línea/i.test(await verify(page, 1))); await page.locator('[data-close="verify-dialog"]').last().click();
  // Impresión: cada número y título concuerda, títulos largos y continuaciones.
  for (const n of [30, 60, 90, 120]) {
    const list = Array.from({ length: n }, (_, i) => `Tema ${i + 1} · ${i === 0 ? 'Título con acentos y nombre del artista' : 'Canción del encuentro'}`);
    await generate(page, `Impresión ${n}`, list, 2);
    const printSet = (await state(page)).sets.at(-1);
    await page.locator('.set-row').filter({ has: page.getByRole('heading', { name: `Impresión ${n}`, exact: true }) }).getByRole('button', { name: 'Ver / Imprimir' }).click();
    const printed = await page.locator('#print-root .music-ticket').evaluateAll(nodes => nodes.map(node => ({ code: Number(node.dataset.code), songs: [...node.querySelectorAll('.music-entry')].map(row => [Number(row.dataset.number), row.querySelector('.music-title').textContent]) })));
    for (const card of printSet.cards) assert.deepEqual(printed.filter(part => part.code === card.code).flatMap(part => part.songs), card.numbers.map(number => [number, list[number - 1]]));
    assert(await page.locator('#print-root .music-page').evaluateAll(pages => pages.every(page => page.scrollHeight <= page.clientHeight + 1)));
    await page.locator('[data-close="preview-dialog"]').click();
    await page.pdf({ path: path.join(out, `cartones-${n}.pdf`), preferCSSPageSize: true, printBackground: true });
  }
  const longSongs = Array.from({ length: 30 }, (_, i) => `Tema ${i + 1}: ` + 'Canción de nombre extenso con acentos y espacios. '.repeat(180));
  await generate(page, 'Títulos extensos', longSongs, 1);
  const longSet = (await state(page)).sets.at(-1);
  await page.locator('.set-row').first().getByRole('button', { name: 'Ver / Imprimir' }).click();
  const textByNumber = await page.locator('#print-root .music-entry').evaluateAll(rows => {
    const result = {}; for (const row of rows) result[row.dataset.number] = (result[row.dataset.number] || '') + row.querySelector('.music-title').textContent; return result;
  });
  for (const number of longSet.cards[0].numbers) assert.equal(textByNumber[number], longSongs[number - 1].trim());
  assert(await page.locator('#print-root .music-page').count() > 1);
  assert(await page.locator('#print-root .music-page').evaluateAll(pages => pages.every(page => page.scrollHeight <= page.clientHeight + 1)));
  await page.locator('[data-close="preview-dialog"]').click();
  await page.pdf({ path: path.join(out, 'continuaciones.pdf'), preferCSSPageSize: true, printBackground: true });
  // Restauración mixta en perfil vacío, cancelación, índices inválidos.
  const mixed = await state(page), fresh = await browser.newContext({ hasTouch: true }), recovered = await fresh.newPage(); await recovered.goto(url); await ready(recovered);
  await restore(recovered, mixed); assert.deepEqual(await state(recovered), mixed);
  const cancel = structuredClone(mixed); cancel.games[0].name = 'No guardar'; await restore(recovered, cancel, true); assert.deepEqual(await state(recovered), mixed);
  const broken = structuredClone(mixed); broken.games.at(-1).drawn = [31];
  await recovered.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(broken)) });
  await recovered.waitForFunction(() => document.getElementById('notice').textContent.startsWith('No se pudo restaurar'));
  assert.deepEqual(await state(recovered), mixed);
  await generate(recovered, 'Código siguiente', ['A', 'B'], 2); assert.equal((await state(recovered)).sets.at(-1).cards[0].code, mixed.nextCode);
  await play(recovered, 'Código siguiente');
  await recovered.locator('#draw').click(); await recovered.waitForFunction(() => document.getElementById('draw-count').textContent === '1');
  await recovered.locator('#draw').click(); await recovered.waitForFunction(() => document.getElementById('draw-count').textContent === '2'); assert(await recovered.locator('#draw').isDisabled());
  await recovered.setViewportSize({ width: 390, height: 844 }); assert(await recovered.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await recovered.locator('#board button').first().tap(); assert.equal(await recovered.locator('#song-detail').textContent(), '1 · A'); assert.equal(await recovered.locator('#draw-count').textContent(), '2'); await recovered.screenshot({ path: path.join(out, '04-mobile.png'), fullPage: true });
  await recovered.setViewportSize({ width: 1440, height: 1000 }); await recovered.locator('#expand').click();
  await recovered.screenshot({ path: path.join(out, '05-ampliado.png'), fullPage: true });
  const fileContext = await browser.newContext({ offline: true }), local = await fileContext.newPage();
  await local.goto('file:///' + path.join(__dirname, '..', 'index.html').replaceAll('\\', '/')); await ready(local); await generate(local, 'Sin red', songs, 1); assert.equal((await state(local)).sets[0].cardSize, 5);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log('PASS musical: migración sin pérdida, carpeta, cartones, sorteo, hover/foco/toque, bingo sin línea, impresión con continuaciones, respaldos mixtos, móvil y file:// sin red.');
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });


