/* QA opcional: usa Playwright si ya está disponible en el entorno de pruebas.
   No es una dependencia de la aplicación. BINGO_PLAYWRIGHT puede indicar su ruta. */
const { chromium } = require(process.env.BINGO_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = path.join(__dirname, 'artifacts'); fs.mkdirSync(output, { recursive: true });
const B = require('../js/domain.js');
const url = 'http://127.0.0.1:8080';
let browser;
async function ready(page) { await page.waitForFunction(() => document.getElementById('lock-warning').hidden); }
async function persisted(page) { return page.evaluate(() => BingoStorage.read()); }
async function generate(page, name, count) {
  await page.locator('[data-view="sets"]').click();
  await page.locator('#set-name').fill(name); await page.locator('#quantity').fill(String(count)); await page.locator('#generate').click();
  await page.waitForFunction(name => [...document.querySelectorAll('.set-info h3')].some(n => n.textContent === name), name);
  await page.waitForFunction(() => !document.getElementById('generate').disabled);
}
async function createGame(page, name) {
  await page.locator('[data-view="game"]').click(); await page.locator('#new-game').click();
  await page.locator('#game-name').fill(name); await page.locator('#game-form button[type=submit]').click();
  await page.waitForFunction(() => !document.getElementById('game-dialog').open && !document.getElementById('draw').disabled);
}
async function checkCode(page, code, text) {
  await page.locator('#card-code').fill(String(code)); await page.locator('#verify-form button').click();
  assert((await page.locator('#verify-result').textContent()).includes(text));
}
async function upload(page, object) {
  await page.locator('#import-file').setInputFiles({ name: 'respaldo.json', mimeType: 'application/json', buffer: Buffer.from(typeof object === 'string' ? object : JSON.stringify(object)) });
}
(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url); await ready(page);
  assert.equal(await page.locator('.number-cell').count(), 90);
  assert(await page.locator('#verify-open').isDisabled());
  await page.screenshot({ path: path.join(output, '01-inicio.png'), fullPage: true });
  await page.locator('[data-view="sets"]').click();
  await page.locator('#set-name').fill('Inválido');
  for (const n of ['0', '1.5', '1001']) { await page.locator('#quantity').fill(n); await page.locator('#generate').click(); assert.equal((await persisted(page)).sets.length, 0); }
  for (const count of [1, 6, 7, 100, 1000]) {
    await generate(page, `Set ${count}`, count);
    const row = page.locator('.set-row').filter({ has: page.getByRole('heading', { name: `Set ${count}`, exact: true }) });
    await row.getByRole('button', { name: 'Ver / Imprimir' }).click();
    assert.equal(await page.locator('#print-root .ticket').count(), count);
    const savedSet = (await persisted(page)).sets.find(s => s.name === `Set ${count}`);
    const printed = await page.locator('#print-root .ticket').evaluateAll(tickets => tickets.map(t => ({ code: Number(t.dataset.code), numbers: [...t.querySelectorAll('.ticket-cell')].map(cell => cell.textContent === '' ? null : Number(cell.textContent)) })));
    assert.deepEqual(printed, savedSet.cards.map(card => ({ code: card.code, numbers: card.matrix.flat() })));
    if (count !== 1000) {
      await page.evaluate(() => { window.originalPrint = window.print; window.printInvoked = false; window.print = () => { window.printInvoked = true; }; });
      await page.locator('#print').click();
      await page.waitForFunction(() => window.printInvoked);
      assert.equal(await page.locator('#preview-dialog').evaluate(dialog => dialog.open), false);
      await page.evaluate(() => { window.print = window.originalPrint; });
      await page.pdf({ path: path.join(output, `cartones-${count}.pdf`), preferCSSPageSize: true, printBackground: true });
    } else await page.locator('[data-close="preview-dialog"]').click();
  }
  let state = await persisted(page);
  const codes = state.sets.flatMap(s => s.cards.map(c => c.code)); assert.equal(new Set(codes).size, 1114);
  const matrices = state.sets.map(s => s.cards);
  await page.reload(); await ready(page); assert.deepEqual((await persisted(page)).sets.map(s => s.cards), matrices);
  await page.locator('[data-view="sets"]').click();
  await page.screenshot({ path: path.join(output, '02-cartones.png'), fullPage: true });
  await createGame(page, 'Ronda de prueba');
  // Sacar exactamente 23 y recuperar el mismo estado.
  for (let i = 0; i < 23; i++) { await page.locator('#draw').click(); await page.waitForFunction(n => document.getElementById('draw-count').textContent === String(n), i + 1); }
  const before = await persisted(page); await page.reload(); await ready(page);
  assert.deepEqual(await persisted(page), before); assert.equal(await page.locator('.number-cell.hit').count(), 23);
  // Dos eventos del mismo turno no producen dos extracciones.
  await page.evaluate(() => { document.getElementById('draw').click(); document.getElementById('draw').click(); });
  await page.waitForFunction(() => document.getElementById('draw-count').textContent === '24');
  assert.equal((await persisted(page)).games[0].drawn.length, 24);
  // Fallo de almacenamiento: no anunciar un número que no se guardó.
  await page.evaluate(() => { window.savedUpdate = BingoStorage.update; BingoStorage.update = async () => { throw new Error('Fallo simulado de almacenamiento'); }; });
  await page.locator('#draw').click(); assert.equal(await page.locator('#draw-count').textContent(), '24');
  assert((await page.locator('#notice').textContent()).includes('Fallo simulado'));
  await page.evaluate(() => { BingoStorage.update = window.savedUpdate; delete window.savedUpdate; });
  await page.locator('#verify-open').click(); assert(await page.locator('#draw').isDisabled());
  assert.equal(await page.evaluate(() => document.activeElement.id), 'card-code');
  await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Verificar');
  await checkCode(page, 'abc', 'código numérico válido');
  await checkCode(page, '999999', 'No se encontró');
  await checkCode(page, '1', 'otro set');
  await checkCode(page, ' 115 ', 'Bingo');
  await page.locator('[data-close="verify-dialog"]').last().click();
  await page.locator('#expand').click();
  await page.screenshot({ path: path.join(output, '03-tablero-ampliado.png'), fullPage: true });
  await page.keyboard.press('Escape');
  // Otra pestaña no puede operar; toma el control al cerrar la primera.
  const other = await context.newPage(); await other.goto(url); await other.waitForFunction(() => !document.getElementById('lock-warning').hidden);
  assert(await other.locator('#draw').isDisabled()); await page.close();
  await other.locator('#take-control').click(); await ready(other);
  assert.equal(await other.locator('#draw-count').textContent(), '24');
  await createGame(other, 'Otra ronda'); state = await persisted(other);
  assert.equal(state.games.length, 2); assert.equal(state.games[0].drawn.length, 24); assert.equal(state.games[1].drawn.length, 0);
  // Respaldo controlado para comprobar resultados visibles y restauración.
  const fixture = B.emptyState(), matrix = B.generateCard();
  fixture.sets = [{ id: 'fixed-set', mode: 'classic', name: 'Evento de prueba', createdAt: new Date().toISOString(), cards: [{ code: 1, matrix }] }];
  fixture.nextCode = 2;
  fixture.games = [{ id: 'fixed-game', name: 'Línea de prueba', setId: 'fixed-set', createdAt: new Date().toISOString(), drawn: matrix[1].filter(n => n !== null) }]; fixture.selectedGame = 'fixed-game';
  await other.locator('[data-view="sets"]').click();
  const snapshot = await persisted(other);
  await upload(other, fixture); await other.locator('#confirm-dialog').waitFor({ state: 'visible' });
  await other.locator('[data-close="confirm-dialog"]').click(); assert.deepEqual(await persisted(other), snapshot);
  for (const corrupt of ['{broken', { ...fixture, version: 9 }, { ...fixture, nextCode: 1 }, { ...fixture, games: [{ ...fixture.games[0], drawn: [1, 1] }] }]) {
    await upload(other, corrupt); await other.waitForFunction(() => document.getElementById('notice').textContent.startsWith('No se pudo restaurar')); assert.deepEqual(await persisted(other), snapshot);
  }
  await upload(other, fixture); await other.locator('#confirm-import').click();
  await other.waitForFunction(() => !document.getElementById('confirm-dialog').open);
  assert.deepEqual(await persisted(other), fixture);
  await other.locator('[data-view="game"]').click(); await other.locator('#verify-open').click(); await checkCode(other, '1', 'Línea válida');
  assert((await other.locator('#verify-result').textContent()).includes('Bingo no válido'));
  await other.screenshot({ path: path.join(output, '04-verificar-linea.png'), fullPage: true });
  await other.locator('[data-close="verify-dialog"]').last().click();
  const all = fixture.sets[0].cards[0].matrix.flat().filter(n => n !== null); fixture.games[0].drawn = all;
  await other.locator('[data-view="sets"]').click(); await upload(other, fixture); await other.locator('#confirm-import').click(); await other.waitForFunction(() => !document.getElementById('confirm-dialog').open);
  await other.locator('[data-view="game"]').click(); await other.locator('#verify-open').click(); await checkCode(other, '1', '¡Bingo válido!');
  await other.locator('[data-close="verify-dialog"]').last().click();
  await other.locator('[data-view="sets"]').click();
  const downloadPromise = other.waitForEvent('download'); await other.locator('#export').click(); const download = await downloadPromise;
  const backup = path.join(output, 'respaldo-prueba.json'); await download.saveAs(backup);
  assert.deepEqual(JSON.parse(fs.readFileSync(backup)), fixture);
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } }), restored = await fresh.newPage();
  await restored.goto(url); await ready(restored); await restored.locator('[data-view="sets"]').click(); await upload(restored, fs.readFileSync(backup, 'utf8')); await restored.locator('#confirm-import').click(); await restored.waitForFunction(() => !document.getElementById('confirm-dialog').open);
  assert.deepEqual(await persisted(restored), fixture);
  await restored.locator('[data-view="game"]').click(); await restored.locator('#verify-open').click(); await checkCode(restored, '1', '¡Bingo válido!'); await restored.locator('[data-close="verify-dialog"]').last().click();
  await generate(restored, 'Después de restaurar', 1); assert.equal((await persisted(restored)).sets[1].cards[0].code, 2);
  // Fin de bolillero y vista móvil.
  await restored.locator('[data-view="game"]').click();
  for (let i = 15; i < 90; i++) { await restored.locator('#draw').click(); await restored.waitForFunction(n => document.getElementById('draw-count').textContent === String(n), i + 1); }
  assert(await restored.locator('#draw').isDisabled()); assert.equal(new Set((await persisted(restored)).games[0].drawn).size, 90);
  await restored.setViewportSize({ width: 390, height: 844 });
  assert(await restored.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await restored.screenshot({ path: path.join(output, '05-movil.png'), fullPage: true });
  // Abrir directamente el HTML también debe permitir generar y persistir.
  const local = await browser.newContext(), filePage = await local.newPage();
  await filePage.goto('file:///' + path.join(__dirname, '..', 'index.html').replaceAll('\\', '/')); await ready(filePage);
  await generate(filePage, 'Archivo local', 1); await filePage.reload(); await ready(filePage); assert.equal((await persisted(filePage)).sets.length, 1);
  assert.deepEqual(errors, []);
  console.log('PASS: generación 1/6/7/100/1000, persistencia, PDF, 90 bolillas, concurrencia, fallo de guardado, reclamos, respaldo, restauración, móvil y apertura file://.');
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });

