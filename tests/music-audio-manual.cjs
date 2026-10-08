/* Comprobación audible opcional; usa un perfil temporal separado del juego del usuario. */
const {chromium}=require(process.env.BINGO_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:false,ignoreDefaultArgs:['--mute-audio']});
 const page=await browser.newPage({viewport:{width:1200,height:950}});
 await page.goto('http://127.0.0.1:8080/');await page.waitForFunction(()=>!document.getElementById('generate').disabled);
 await page.evaluate(async()=>{const s=Bingo.emptyState();s.nextCode=2;s.sets=[{id:'audio-test',mode:'music',name:'Prueba de sonido · perfil temporal',createdAt:'2026-10-06',songs:['Tono de prueba'],cardSize:1,audioRefs:[null],clips:[{start:0,end:null}],cards:[{code:1,numbers:[1]}]}];s.games=[{id:'round',name:'Prueba de sonido',createdAt:'2026-10-06',setId:'audio-test',drawn:[]}];s.selectedGame='round';await BingoStorage.update(()=>s);});
 await page.reload();await page.waitForFunction(()=>!document.getElementById('draw').disabled);
 await page.locator('#audio-open').click();await page.locator('#audio-files').setInputFiles({name:'Tono de prueba.wav',mimeType:'audio/wav',buffer:fs.readFileSync(path.join(__dirname,'artifacts/audio/tono-prueba.wav'))});await page.locator('[data-close="audio-dialog"]').last().click();
 console.log('LISTO: ventana de Chrome con una partida temporal. Sacar bolilla reproduce un tono; Reproducir canción lo repite. Cerrar esta ventana termina la prueba.');
 await new Promise(resolve=>browser.on('disconnected',resolve));
})().catch(e=>{console.error(e);process.exitCode=1;});
