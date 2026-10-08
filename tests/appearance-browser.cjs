const { chromium } = require(process.env.BINGO_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const B = require('../js/domain.js');
const out = path.join(__dirname, 'artifacts/appearance'); fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8080', key='bingo-clasico-musical:appearance:v1';
let browser, server;
const ready=p=>p.waitForFunction(()=>!document.getElementById('generate').disabled);
const change=(p,mode,palette)=>p.evaluate(v=>BingoAppearance.set(v),{mode,palette});
(async()=>{
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'});
 const p=await context.newPage(), errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{new MutationObserver(()=>{if(document.body && !window.firstMode) window.firstMode=document.documentElement.dataset.mode;}).observe(document,{childList:true,subtree:true});});
 await p.goto(url);await ready(p);assert.equal(await p.evaluate(()=>window.firstMode),'dark');
 await p.locator('.appearance-open').click(); await p.locator('#appearance-mode').selectOption('light');await p.locator('#appearance-palette').selectOption('plum');await p.keyboard.press('Escape');assert(await p.locator('.appearance-open').evaluate(e=>e===document.activeElement));
 await p.reload();await ready(p);assert.equal(await p.evaluate(()=>window.firstMode),'light');assert.equal(await p.evaluate(()=>BingoAppearance.get().palette),'plum');
 await change(p,'system','ocean');await p.emulateMedia({colorScheme:'light'});await p.waitForFunction(()=>document.documentElement.dataset.mode==='light');await p.emulateMedia({colorScheme:'dark'});await p.waitForFunction(()=>document.documentElement.dataset.mode==='dark');await change(p,'light','ocean');await p.emulateMedia({colorScheme:'light'});await p.emulateMedia({colorScheme:'dark'});assert.equal(await p.locator('html').getAttribute('data-mode'),'light');
 const state=B.emptyState(); state.nextCode=3;
 state.sets=[{id:'classic',mode:'classic',name:'Clásico QA',createdAt:'2026-10-05',cards:[{code:1,matrix:B.generateCard()}]},{id:'music',mode:'music',name:'Musical QA',createdAt:'2026-10-05',songs:Array.from({length:30},(_,i)=>`Canción ${i+1} · Don y pasos al costado`),cardSize:5,audioRefs:Array(30).fill(null),clips:Array.from({length:30},()=>({start:0,end:null})),cards:[{code:2,numbers:[1,2,3,4,5]}]}];
 state.games=state.sets.map(s=>({id:s.id,name:s.name,createdAt:s.createdAt,setId:s.id,drawn:[1,2]}));state.selectedGame='music';
 await p.evaluate(s=>BingoStorage.update(()=>s),state);await p.reload();await ready(p);
 const contrasts=[];
 for(const mode of ['light','dark'])for(const palette of ['forest','ocean','plum']){
  await change(p,mode,palette);await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>BingoStorage.read()),state);
  const result=await p.evaluate(()=>{
   const s=getComputedStyle(document.documentElement), pairs=[['--ink','--paper',4.5],['--ink','--white',4.5],['--muted','--white',4.5],['--muted','--surface-alt',4.5],['--green','--white',4.5],['--on-accent','--solid',4.5],['--on-soft','--lime',4.5],['--hit-text','--hit',4.5],['--cell-text','--cell',4.5],['--warning-text','--warning',4.5],['--error-text','--error',4.5],['--border','--white',3],['--border','--cell',3],['--focus','--white',3],['--focus','--paper',3],['--ball-text','--ball-start',4.5],['--ball-text','--ball-end',4.5]];
   const lum=h=>{const v=h.trim().replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
   return pairs.map(([a,b,min])=>{const x=lum(s.getPropertyValue(a)),y=lum(s.getPropertyValue(b));return {a,b,min,ratio:(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};});
  });contrasts.push({mode,palette,result}); for(const r of result)assert(r.ratio>=r.min,`${mode}/${palette} ${r.a}/${r.b} ${r.ratio}`);
  await p.screenshot({path:path.join(out,`${mode}-${palette}-desktop.png`),fullPage:true});
  await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,`${mode}-${palette}-mobile.png`),fullPage:true});await p.setViewportSize({width:1440,height:1000});
 }
 fs.writeFileSync(path.join(out,'contrast.json'),JSON.stringify(contrasts,null,2));
 await p.locator('#expand').click();await p.locator('.appearance-expanded').click();await p.locator('#appearance-mode').selectOption('dark');await p.keyboard.press('Escape');assert(await p.locator('.appearance-expanded').evaluate(e=>e===document.activeElement));await p.locator('#expand').click();
 await p.locator('[data-view="sets"]').click();await p.locator('#set-name').fill('Borrador sin perder');await p.locator('.appearance-open').click();await p.locator('#appearance-palette').selectOption('plum');await p.locator('[data-close="appearance-dialog"]').last().click();assert.equal(await p.locator('#set-name').inputValue(),'Borrador sin perder');
 for(const name of ['Clásico QA','Musical QA']){
  await p.locator('.set-row').filter({has:p.getByRole('heading',{name,exact:true})}).getByRole('button',{name:'Ver / Imprimir'}).click();
  await p.locator('[data-close="preview-dialog"]').click();await p.emulateMedia({media:'print'});
  let baseline;
  for(const mode of ['light','dark'])for(const palette of ['forest','ocean','plum']){
   await change(p,mode,palette);const geometry=await p.locator('#print-root').evaluate(e=>({text:e.textContent,nodes:[...e.querySelectorAll('*')].map(n=>{const r=n.getBoundingClientRect();return [r.x,r.y,r.width,r.height];}),paper:[...e.querySelectorAll('.ticket,.music-ticket')].map(n=>getComputedStyle(n).backgroundColor)}));if(baseline)assert.deepEqual(geometry,baseline);else baseline=geometry;
  }
  await p.pdf({path:path.join(out,name.startsWith('Clásico')?'classic.pdf':'music.pdf'),preferCSSPageSize:true,printBackground:true});await p.screenshot({path:path.join(out,name.startsWith('Clásico')?'classic-print.png':'music-print.png'),fullPage:true});await p.emulateMedia({media:'screen'});
 }
 // Medición de continuaciones nuevas bajo cada tema (no solo DOM ya generado).
 const long={...state.sets[1],songs:state.sets[1].songs.map(s=>s+' nombre extenso con acentos '.repeat(180))};let measured;
 for(const mode of ['light','dark'])for(const palette of ['forest','ocean','plum']){await change(p,mode,palette);const current=await p.evaluate(s=>{const pages=BingoMusicPrint.pages(s);return pages.map(n=>n.outerHTML);},long);assert(current.length>1);if(measured)assert.deepEqual(current,measured);else measured=current;}
 const second=await context.newPage();await second.goto(url);await second.waitForFunction(()=>!document.getElementById('lock-warning').hidden);await second.locator('.appearance-open').click();await second.locator('#appearance-palette').selectOption('ocean');assert.equal(await second.evaluate(()=>BingoAppearance.get().palette),'ocean');await second.close();
 await p.evaluate(()=>{Storage.prototype.setItem=function(){throw Error('denied');};});await p.locator('.appearance-open').click();await p.locator('#appearance-mode').selectOption('light');assert(await p.locator('#appearance-status').isVisible());await p.keyboard.press('Escape');
 assert.equal((await p.evaluate(()=>BingoStorage.read())).version,4);assert.deepEqual(await p.evaluate(()=>BingoStorage.read()),state);
 await p.reload();await ready(p);await change(p,'dark','plum');await p.locator('[data-view="sets"]').click();
 const downloadPromise=p.waitForEvent('download');await p.locator('#export').click();const download=await downloadPromise;const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.deepEqual(backup,state);
 await p.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});await p.locator('#confirm-import').click();await p.waitForFunction(()=>!document.getElementById('confirm-dialog').open);assert.equal(await p.locator('html').getAttribute('data-mode'),'dark');
 await p.locator('[data-view="game"]').click();await p.locator('#new-game').click();await p.locator('#game-form button[type=submit]').click();await p.waitForFunction(()=>!document.getElementById('game-dialog').open);assert.equal(await p.locator('html').getAttribute('data-palette'),'plum');
 const local=await browser.newPage();await local.goto('file:///'+path.resolve('index.html').replaceAll('\\','/'));await ready(local);await change(local,'dark','ocean');assert.equal(await local.locator('html').getAttribute('data-mode'),'dark');await local.close();
 server=http.createServer((req,res)=>{const relative=decodeURI(req.url).replace(/^\/bingo-clasico-musical\//,'');if(!['index.html','styles.css','js/appearance.js','js/domain.js','js/storage.js','js/music-print.js','js/music-audio.js','js/app.js'].includes(relative)){res.writeHead(404).end();return;}res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript':relative.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(__dirname,'..',relative)));});await new Promise(r=>server.listen(8081,'127.0.0.1',r));
 const sub=await browser.newPage(),failed=[];sub.on('response',r=>{if(r.status()>=400)failed.push(r.url());});await sub.goto('http://127.0.0.1:8081/bingo-clasico-musical/index.html');await ready(sub);await change(sub,'dark','ocean');assert.deepEqual(failed,[]);assert.deepEqual(errors,[]);
 console.log('PASS apariencia: seis combinaciones, contraste, móvil, sistema, persistencia, teclado, solo lectura, fallos, datos, impresión, continuaciones, file y subdirectorio.');await browser.close();server.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();if(server)server.close();process.exitCode=1;});
