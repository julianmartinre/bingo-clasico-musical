/* QA con audio WAV sintético: sin archivos musicales del usuario ni dependencias de ejecución. */
const { chromium } = require(process.env.BINGO_PLAYWRIGHT || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const B = require('../js/domain.js');
const out = path.join(__dirname,'artifacts/audio');fs.mkdirSync(out,{recursive:true});
const url='http://127.0.0.1:8080';
function wave(seconds=20) {
 const rate=8000, count=rate*seconds, b=Buffer.alloc(44+count*2);
 b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(count*2,40);
 for(let i=0;i<count;i++)b.writeInt16LE(Math.round(2500*Math.sin(2*Math.PI*440*i/rate)),44+i*2);return b;
}
const tone=wave();fs.writeFileSync(path.join(out,'tono-prueba.wav'),tone);
const ready=p=>p.waitForFunction(()=>!document.getElementById('generate').disabled);
const read=p=>p.evaluate(()=>BingoStorage.read());
const playing=p=>p.waitForFunction(()=>!document.getElementById('music-player').paused&&document.getElementById('music-player').currentTime>0.05&&document.getElementById('audio-status').dataset.status==='playing');
async function draw(p){const count=Number(await p.locator('#draw-count').textContent());await p.locator('#draw').click();await p.waitForFunction(n=>Number(document.getElementById('draw-count').textContent)===n+1,count);}
const paused=p=>p.locator('#music-player').evaluate(e=>e.paused);
const closeAudio=p=>p.locator('[data-close="audio-dialog"]').last().click();
async function restore(p,state,cancel=false) {
 await p.locator('[data-view="sets"]').click();await p.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(state))});
 await p.locator(cancel?'[data-close="confirm-dialog"]':'#confirm-import').click();await p.waitForFunction(()=>!document.getElementById('confirm-dialog').open);
}
function fixture(){const state=B.emptyState();state.nextCode=3;state.sets=[{id:'music',mode:'music',name:'Música de prueba',createdAt:'2026-10-06',songs:['Canción Uno','Don','Don','Otro','<b>Texto</b>','Final'],cardSize:1,audioRefs:Array(6).fill(null),clips:Array.from({length:6},()=>({start:0,end:null})),cards:[{code:1,numbers:[1]}]},{id:'classic',mode:'classic',name:'Clásico',createdAt:'2026-10-06',cards:[{code:2,matrix:B.generateCard()}]}];state.games=[{id:'music-game',name:'Ronda musical',createdAt:'2026-10-06',setId:'music',drawn:[]},{id:'classic-game',name:'Ronda clásica',createdAt:'2026-10-06',setId:'classic',drawn:[]}];state.selectedGame='music-game';return state;}
async function seed(p){await p.evaluate(s=>BingoStorage.update(()=>s),fixture());await p.reload();await ready(p);await p.evaluate(()=>{Bingo.draw=(drawn,random,total)=>Array.from({length:total},(_,i)=>i+1).find(n=>!drawn.includes(n));});}
async function upload(p,files=[{name:'CANCION UNO.wav',mimeType:'audio/wav',buffer:tone}]){await p.locator('#audio-open').click();await p.locator('#audio-files').setInputFiles(files);}
let browser,server;
(async()=>{
 browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1100}}),p=await context.newPage(),errors=[],uploads=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!['GET','HEAD'].includes(r.method())||(!r.url().startsWith(url)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:')))uploads.push(r.url());});
 await p.goto(url);await ready(p);await seed(p);const initial=await read(p);
 await upload(p,[{name:'CANCION UNO.wav',mimeType:'audio/wav',buffer:tone},{name:'Don.wav',mimeType:'audio/wav',buffer:tone},{name:'Otro.wav',mimeType:'audio/wav',buffer:tone},{name:'Otro.mp3',mimeType:'audio/mpeg',buffer:tone},{name:'<img src=x>.wav',mimeType:'audio/wav',buffer:tone}]);
 assert.equal(await p.locator('#audio-link-1').inputValue(),'0');for(const n of [2,3,4,5,6])assert.equal(await p.locator(`#audio-link-${n}`).inputValue(),'');assert.equal(await p.locator('#audio-links img,#audio-links b').count(),0);
 await p.locator('#audio-link-2').selectOption('1');await p.locator('#audio-link-3').selectOption('1');await p.locator('#audio-files').setInputFiles([]);assert.equal(await p.locator('#audio-link-2').inputValue(),'1');
 await p.locator('#audio-files').setInputFiles({name:'Final.wav',mimeType:'audio/wav',buffer:tone});assert.equal(await p.locator('#audio-link-2').inputValue(),'1');assert.equal(await p.locator('#audio-link-6').inputValue(),'5');
 await p.screenshot({path:path.join(out,'asociaciones.png'),fullPage:true});await closeAudio(p);assert.deepEqual(await read(p),initial);
 await draw(p);await playing(p);assert.equal((await read(p)).games[0].drawn.length,1);
 const before=await p.locator('#music-player').evaluate(e=>e.currentSrc);
 await p.locator('#audio-play').click();assert(await paused(p));await p.locator('#audio-play').focus();await p.keyboard.press('Enter');await playing(p);
 await p.locator('#audio-volume').fill('25');assert.equal(await p.locator('#music-player').evaluate(e=>e.volume),.25);
 await p.locator('#audio-restart').click();assert(await p.locator('#music-player').evaluate(e=>e.currentTime<1));
 // La próxima pista falla al guardar: no cambia el audio ni el historial.
 await p.evaluate(()=>{window.originalUpdate=BingoStorage.update;BingoStorage.update=()=>Promise.reject(Error('Guardado simulado'));});await p.locator('#draw').click();await p.waitForFunction(()=>document.getElementById('notice').textContent.includes('Guardado simulado'));assert.equal(await p.locator('#music-player').evaluate(e=>e.currentSrc),before);assert.equal((await read(p)).games[0].drawn.length,1);await p.evaluate(()=>BingoStorage.update=window.originalUpdate);
 await draw(p);await playing(p);assert.notEqual(await p.locator('#music-player').evaluate(e=>e.currentSrc),before);assert.equal(await p.locator('#audio-track').textContent(),'2 · Don');
 await p.locator('#verify-open').click();assert(await paused(p));await p.locator('[data-close="verify-dialog"]').last().click();assert(await paused(p));await p.locator('#audio-play').click();await playing(p);
 await p.locator('#board button').first().click();assert.equal((await read(p)).games[0].drawn.length,2);await p.keyboard.press('Escape');
 // Temas y ampliación no reinician ni sustituyen la pista.
 const src=await p.locator('#music-player').evaluate(e=>e.currentSrc);const time=await p.locator('#music-player').evaluate(e=>e.currentTime);
 for(const mode of ['light','dark'])for(const palette of ['forest','ocean','plum']){await p.evaluate(v=>BingoAppearance.set(v),{mode,palette});await p.waitForTimeout(160);await p.screenshot({path:path.join(out,`${mode}-${palette}.png`),fullPage:true});}
 assert.equal(await p.locator('#music-player').evaluate(e=>e.currentSrc),src);assert(await p.locator('#music-player').evaluate(e=>e.currentTime)>=time);
 await p.locator('#expand').click();assert(await p.locator('#audio-open').isVisible());await p.setViewportSize({width:390,height:844});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(out,'mobile-expanded.png'),fullPage:true});await p.setViewportSize({width:1440,height:1100});await p.locator('#expand').click();
 // Cambiar vínculo de la canción actual detiene y exige clic.
 await p.locator('#audio-open').click();await p.locator('#audio-link-2').selectOption('0');assert(await paused(p));await closeAudio(p);await p.locator('#audio-play').click();await playing(p);
 // Rechazo de play: recuperar sin sortear otra vez.
 await p.evaluate(()=>{window.realPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('blocked','NotAllowedError'));};});await draw(p);await p.waitForFunction(()=>document.getElementById('audio-status').dataset.status==='blocked');assert.equal((await read(p)).games[0].drawn.length,3);await p.evaluate(()=>HTMLMediaElement.prototype.play=window.realPlay);await p.locator('#audio-play').click();await playing(p);
 await draw(p);await p.waitForFunction(()=>document.getElementById('audio-status').dataset.status==='missing');assert(await paused(p));assert.equal(await p.locator('#audio-status').getAttribute('data-status'),'missing');assert.equal((await read(p)).games[0].drawn.length,4);
 // Un archivo corrupto no revierte la extracción.
 await upload(p,[{name:'roto.wav',mimeType:'audio/wav',buffer:Buffer.from('no es audio')}]);await p.locator('#audio-link-5').selectOption('6');await closeAudio(p);await draw(p);await p.waitForFunction(()=>document.getElementById('audio-status').dataset.status==='error');assert.equal((await read(p)).games[0].drawn.length,5);
 await draw(p);await playing(p);await p.locator('#music-player').evaluate(e=>e.currentTime=e.duration-.1);await p.waitForFunction(()=>document.getElementById('audio-status').dataset.status==='ended');assert.equal((await read(p)).games[0].drawn.length,6);
 await p.locator('#audio-play').click();await playing(p);await p.locator('#game-select').selectOption('classic-game');await p.waitForFunction(()=>document.getElementById('audio-panel').hidden);assert(await paused(p));await p.locator('#game-select').selectOption('music-game');await p.waitForFunction(()=>!document.getElementById('audio-panel').hidden);assert(await paused(p));
 // Nueva partida detiene, y perder el bloqueo detiene incluso un audio ya iniciado.
 await p.locator('#audio-play').click();await playing(p);await p.locator('#new-game').click();await p.locator('#game-set').selectOption('music');await p.locator('#game-form button[type=submit]').click();await p.waitForFunction(()=>!document.getElementById('game-dialog').open);assert(await paused(p));assert.equal(await p.locator('#audio-status').getAttribute('data-status'),'empty');
 await p.locator('#game-select').selectOption('music-game');await p.waitForFunction(()=>document.getElementById('audio-play').disabled===false);await p.locator('#audio-play').click();await playing(p);
 await p.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await p.waitForFunction(()=>!document.getElementById('lock-warning').hidden);assert(await paused(p));assert(await p.locator('#audio-play').isDisabled());await p.locator('#take-control').click();await ready(p);assert(await paused(p));
 // Otra pestaña ve el juego pero no puede iniciar audio.
 const second=await context.newPage();await second.goto(url);await second.waitForFunction(()=>!document.getElementById('lock-warning').hidden);assert(await second.locator('#audio-play').isDisabled());assert(await second.locator('#audio-open').isDisabled());await second.close();
 const saved=await read(p);await restore(p,saved,true);await p.locator('[data-view="game"]').click();await p.locator('#audio-open').click();assert((await p.locator('#audio-summary').textContent()).includes('5 con audio'));await closeAudio(p);
 await p.locator('[data-view="sets"]').click();await p.locator('#import-file').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{}')});await p.waitForFunction(()=>document.getElementById('notice').textContent.startsWith('No se pudo restaurar'));await p.locator('[data-view="game"]').click();await p.locator('#audio-play').click();await playing(p);
 const reused=structuredClone(saved);reused.sets[0].songs[5]='Otra canción';await restore(p,reused);await p.locator('[data-view="game"]').click();assert(await paused(p));assert.equal(await p.locator('#audio-status').getAttribute('data-status'),'missing');await p.locator('#audio-open').click();assert((await p.locator('#audio-summary').textContent()).includes('0 con audio'));await closeAudio(p);
 await p.reload();await ready(p);assert(await paused(p));assert.equal(await p.locator('#audio-status').getAttribute('data-status'),'missing');
 // Exportación intacta, sin archivos ni vínculos.
 await p.locator('[data-view="sets"]').click();const dp=p.waitForEvent('download');await p.locator('#export').click();const d=await dp;assert.deepEqual(JSON.parse(fs.readFileSync(await d.path(),'utf8')),reused);
 assert.deepEqual(errors,[]);assert.deepEqual(uploads,[]);
 // Mismo flujo de decodificación/reproducción desde archivo local y subdirectorio HTTP.
 server=http.createServer((req,res)=>{const name=req.url.replace(/^\/bingo-clasico-musical\//,'');const allowed=['index.html','styles.css','js/appearance.js','js/domain.js','js/storage.js','js/music-print.js','js/music-audio.js','js/app.js'];if(!allowed.includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(path.join(__dirname,'..',name)));});await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 for(const address of ['file:///'+path.resolve('index.html').replaceAll('\\','/'),`http://127.0.0.1:${server.address().port}/bingo-clasico-musical/index.html`]){const local=await browser.newPage();await local.goto(address);await ready(local);await seed(local);await upload(local);await closeAudio(local);await local.locator('#draw').click();await playing(local);assert.equal((await read(local)).games[0].drawn.length,1);await local.close();}
 console.log('PASS audio: asociaciones, decodificación WAV y avance real, controles, fallos, extracción confirmada, verificador, contextos, temas, móvil, solo lectura, importación, privacidad, file y subdirectorio. No equivale a escucha humana.');
 await browser.close();server.close();
})().catch(async e=>{console.error(e);if(browser)await browser.close();if(server)server.close();process.exitCode=1;});
