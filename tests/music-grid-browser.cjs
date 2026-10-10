const { chromium } = require(process.env.BINGO_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const out = path.join(__dirname, 'artifacts/grid'); fs.mkdirSync(out, { recursive: true });
const folder = fs.mkdtempSync(path.join(out, 'Canciones-'));
for (let i = 1; i <= 30; i++) fs.writeFileSync(path.join(folder, `Canción ${i}.mp3`), 'fixture');
const empty = fs.mkdtempSync(path.join(out, 'Vacia-')); fs.writeFileSync(path.join(empty, 'nota.txt'), 'nota');
const ready = p => p.waitForFunction(() => document.getElementById('lock-warning').hidden);
const state = p => p.evaluate(() => BingoStorage.read());
let browser;
(async () => {
  browser = await chromium.launch({ channel: process.env.BINGO_CHANNEL || 'chrome', headless: true });
  const p = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  await p.goto('http://127.0.0.1:8080'); await ready(p);
  await p.locator('[data-view=sets]').click(); await p.locator('#set-mode').selectOption('music');
  const size = p.locator('#music-card-size'), quantity = p.locator('#quantity'), checks = p.locator('.folder-song input[type=checkbox]');
  assert(await size.isDisabled()); await p.locator('#songs-folder').setInputFiles(folder);
  assert.equal(await size.inputValue(), '15'); assert.equal(await size.getAttribute('max'), '15');
  for (const value of ['', '0', '16', '2.5']) {
    await size.fill(value); assert(await p.locator('#generate').isDisabled()); assert(await p.locator('#music-size-error').isVisible()); assert.equal(await size.inputValue(), value);
  }
  await size.fill('12'); await size.focus(); await p.keyboard.press('ArrowUp'); assert.equal(await size.inputValue(), '13'); await p.keyboard.press('ArrowDown'); assert.equal(await size.inputValue(), '12');
  await p.locator('.folder-song input:not([type=checkbox])').first().fill('Nombre editado');
  await p.locator('.folder-song').nth(1).locator('[data-move="-1"]').click(); assert.equal(await size.inputValue(), '12');
  await p.locator('#songs-folder').evaluate(e => e.dispatchEvent(new Event('cancel'))); assert.equal(await size.inputValue(), '12');
  await p.locator('#songs-folder').setInputFiles(empty); assert.equal(await size.inputValue(), '12');
  await quantity.fill('1000');
  for (let i = 29; i >= 8; i--) await checks.nth(i).uncheck();
  assert.equal(await size.inputValue(), '8'); assert.equal(await size.getAttribute('max'), '8'); assert.equal(await quantity.inputValue(), '1'); assert.equal(await quantity.getAttribute('max'), '1');
  assert.match(await p.locator('#music-size-notice').innerText(), /ajustad/);
  await size.fill('4'); assert.equal(await quantity.getAttribute('max'), '70');
  for (let i = 7; i >= 0; i--) await checks.nth(i).uncheck();
  assert(await size.isDisabled()); assert(await p.locator('#generate').isDisabled());
  await p.locator('#songs-folder').setInputFiles(folder); assert.equal(await size.inputValue(), '15');
  for (const k of [1, 4, 12, 15]) {
    await size.fill(String(k)); await quantity.fill('2'); await p.locator('#set-name').fill(`Grilla ${k}`);
    // Detener el guardado para comprobar que toda la preparación queda congelada.
    await p.evaluate(() => { window.realUpdate = BingoStorage.update; BingoStorage.update = async fn => { await new Promise(r => window.finishGrid = r); return window.realUpdate(fn); }; });
    await p.locator('#generate').click(); await p.waitForFunction(() => Boolean(window.finishGrid));
    for (const selector of ['#music-card-size', '#quantity', '#set-name', '#songs-folder']) assert(await p.locator(selector).isDisabled());
    await p.evaluate(() => { BingoStorage.update = window.realUpdate; window.finishGrid(); window.finishGrid = null; });
    await p.waitForFunction(k => [...document.querySelectorAll('.set-info h3')].some(e => e.textContent === `Grilla ${k}`) && !document.getElementById('generate').disabled, k);
    const saved = await state(p), set = saved.sets.at(-1);
    assert.equal(set.cardSize, k); assert.equal(set.cardLayout, 'grid-3x9'); assert.equal(set.cards.length, 2);
    assert(set.cards.every(c => c.numbers.length === k && c.musicMatrix.flat().length === 27));
    const rendered = await p.evaluate(set => {
      const card = set.cards[0], node = BingoMusicPrint.ticket(card, set, card.numbers.slice(1));
      return { cells: node.querySelectorAll('.music-grid-cell').length, blanks: node.querySelectorAll('.blank').length, matches: node.querySelectorAll('.music-grid-cell.matched').length, bad: node.querySelectorAll('.blank.matched').length, names: [...node.querySelectorAll('.music-cell-label')].map(e => e.textContent) };
    }, set);
    assert.equal(rendered.cells, 27); assert.equal(rendered.blanks, 27-k); assert.equal(rendered.matches, k-1); assert.equal(rendered.bad, 0); assert.deepEqual(rendered.names, set.cards[0].numbers.map(n => `${n}. ${set.songs[n-1]}`));
    const row = p.locator('.set-row').filter({ has: p.getByRole('heading', { name: `Grilla ${k}`, exact: true }) });
    await row.getByRole('button', { name: 'Ver / Imprimir' }).click();
    const html = await p.locator('#print-root').innerHTML();
    assert.equal(await p.locator('#print-root .music-grid-cell').count(), 54);
    assert.equal(await p.locator('#print-root .music-entries').count(), 0);
    assert.equal(await p.locator('#print-root .music-page').count(), 1);
    await p.keyboard.press('Escape'); await row.getByRole('button', { name: 'Ver / Imprimir' }).click(); assert.equal(await p.locator('#print-root').innerHTML(), html);
    await p.keyboard.press('Escape');
  }
  const before = await state(p);
  await size.fill('8'); assert.deepEqual(await state(p), before);
  await p.reload(); await ready(p); assert.deepEqual(await state(p), before);
  await p.locator('[data-view=sets]').click();
  // Rechazo real de respaldo corrupto, sin reemplazo parcial.
  const bad = structuredClone(before); bad.sets[0].cards[0].musicMatrix[0][0] = 999;
  await p.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad)) });
  await p.waitForFunction(() => document.getElementById('notice').textContent.includes('No se pudo restaurar')); assert.deepEqual(await state(p), before);
  await p.locator('#import-file').setInputFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(before)) });
  await p.locator('#confirm-import').click(); await p.waitForFunction(() => !document.getElementById('confirm-dialog').open); assert.deepEqual(await state(p), before);
  // Verificador real con K-1 aciertos y prueba visual de las seis apariencias.
  await p.evaluate(async () => { await BingoStorage.update(s => { const set=s.sets.at(-1); s.games=[{id:'g',name:'Ronda',setId:set.id,createdAt:'today',drawn:set.cards[0].numbers.slice(1)}];s.selectedGame='g';return s; }); });
  await p.reload(); await ready(p); await p.locator('#verify-open').click(); await p.locator('#card-code').fill(String(before.sets.at(-1).cards[0].code)); await p.locator('#verify-form button').click();
  assert.match(await p.locator('#verify-result').innerText(), /Bingo no válido/); assert.doesNotMatch(await p.locator('#verify-result').innerText(), /línea/i);
  assert.equal(await p.locator('#verify-result .music-grid-cell.matched').count(), 14);
  for (const mode of ['light','dark']) for (const palette of ['forest','ocean','plum']) {
    await p.evaluate(pref => BingoAppearance.set(pref), { mode,palette });
    await p.screenshot({ path:path.join(out,`${mode}-${palette}.png`),fullPage:true });
    assert.equal(await p.locator('.music-grid-cell').first().evaluate(e=>getComputedStyle(e).color),'rgb(32, 59, 52)');
  }
  await p.setViewportSize({width:390,height:844}); assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:path.join(out,'mobile-verifier.png'),fullPage:true});
  await p.keyboard.press('Escape'); await p.locator('[data-view=sets]').click(); await p.locator('#set-mode').selectOption('music'); await p.locator('#songs-folder').setInputFiles(folder);
  await size.focus(); await p.keyboard.press('ArrowDown'); assert.equal(await size.inputValue(),'14');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); await size.scrollIntoViewIfNeeded(); await p.screenshot({path:path.join(out,'mobile-size.png')});
  // Lista histórica con 20 canciones conserva renderer y títulos.
  assert.equal(await p.evaluate(()=>{const card={code:99,numbers:Array.from({length:20},(_,i)=>i+1)},set={name:'Anterior',cardLayout:'list',songs:card.numbers.map(String)};const node=BingoMusicPrint.ticket(card,set);return node.querySelectorAll('.music-entry').length===20&&node.querySelectorAll('.music-grid').length===0;}),true);
  assert.deepEqual(errors,[]); console.log(`PASS grillas (${await browser.version()}): selector, límites, teclado, bloqueo, K=1/4/12/15, matrices, reimpresión, respaldo atómico, verificador, seis temas, móvil y listas históricas.`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();});
