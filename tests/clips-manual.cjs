const {chromium}=require(process.env.BINGO_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:false,ignoreDefaultArgs:['--mute-audio']});const p=await b.newPage({viewport:{width:1200,height:950}});
 await p.goto('http://127.0.0.1:8080');await p.waitForFunction(()=>!document.getElementById('generate').disabled);
 await p.evaluate(async()=>{const s=Bingo.emptyState();s.nextCode=2;s.sets=[{id:'test',mode:'music',cardLayout:'list',name:'Prueba de fragmento: pitidos agudos durante 2 segundos',createdAt:'2026-10-06',songs:['Tonos de prueba'],audioRefs:[null],clips:[{start:2,end:4}],cardSize:1,cards:[{code:1,numbers:[1]}]}];await BingoStorage.update(()=>s);});
 await p.reload();await p.waitForFunction(()=>!document.getElementById('generate').disabled);await p.locator('[data-view="sets"]').click();await p.getByRole('button',{name:'♫ Audios',exact:true}).click();
 await p.locator('#audio-files').setInputFiles({name:'Tonos de prueba.wav',mimeType:'audio/wav',buffer:fs.readFileSync(path.join(__dirname,'artifacts/clips/segmentos.wav'))});
 console.log('LISTO: Probar fragmento reproduce pitidos agudos por 2 segundos y se detiene. Repetir debe sonar igual, sin tono grave previo ni posterior. Perfil temporal separado.');
 await new Promise(resolve=>b.on('disconnected',resolve));
})().catch(e=>{console.error(e);process.exitCode=1;});
