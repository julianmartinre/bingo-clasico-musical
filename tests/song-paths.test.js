const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const B = require('../js/domain.js'), A = require('../js/music-audio.js');
test('referencias locales, Unicode, límites y URLs', () => {
  for (const v of ['C:\\Musica\\a.mp3', '/home/a.mp3', '\\\\PC\\share\\a.mp3', 'a,b.mp3']) assert.equal(B.audioReference(v), v);
  assert.equal(B.referenceKey('c:\\Mu\u0301sica\\.\\Don.mp3'), 'C:/Música/Don.mp3');
  for (const v of ['https://x/a.mp3', 'file:///a.mp3', 'data:audio/x', '../a.mp3', 'a/../b', 'a\nb', 'a/', 42, undefined]) assert.throws(() => B.audioReference(v));
});
const file = (name, path = '') => ({ name, webkitRelativePath: path, size: 100, lastModified: 1 });
test('coincidencias, homónimos, ambigüedad nueva y prioridad manual', () => {
  const lib = A.library(), set = { id: 's', songs: ['A','B','C','D','Don','Sin'], audioRefs: ['A/tema.mp3','tema.mp3','C:/Descargas/Musica/B/tema.mp3','no.mp3',null,null] };
  const a = file('tema.mp3','Musica/A/tema.mp3'), b = file('tema.mp3','Musica/B/tema.mp3'), don = file('Don.mp3');
  lib.add(set,[a]); assert.equal(lib.file(set,2),a);
  lib.assign(set,4,0); lib.assign(set,6,-1); lib.add(set,[b,don]);
  assert.equal(lib.file(set,1),a); assert.equal(lib.result(set,2).status,'ambiguous'); assert.equal(lib.file(set,3),b);
  assert.equal(lib.file(set,4),a); assert.equal(lib.file(set,5),don); assert.equal(lib.result(set,6).method,'manual');
  lib.automatic(set,4); assert.equal(lib.result(set,4).status,'missing');
  lib.add(set,[file('tema.mp3','Musica/A/tema.mp3')]); assert.equal(lib.files(set).length,3);
  lib.add(set,[file('Don.mp3')]); assert.equal(lib.result(set,5).status,'ambiguous');
  set.audioRefs[1]='Musica/A/tema.mp3'; lib.automatic(set,2); assert.equal(lib.file(set,2),a);
  set.audioRefs[1]='C:/Downloads/Don.mp3'; lib.automatic(set,2); assert.equal(lib.result(set,2).status,'ambiguous');
});
test('estado 3→4 puro, referencias válidas y respaldo atómico por validación', () => {
  const old = { version:3,nextCode:2,selectedGame:'g',sets:[{id:'s',mode:'music',name:'S',createdAt:'today',songs:['Don'],clips:[{start:2,end:4}],cardSize:1,cards:[{code:1,numbers:[1]}]}],games:[{id:'g',setId:'s',name:'G',createdAt:'today',drawn:[1]}] };
  const copy=structuredClone(old), next=B.validateState(old); assert.deepEqual(old,copy); assert.equal(next.version,5); assert.deepEqual(next.sets[0].audioRefs,[null]);
  assert.deepEqual(next.games,old.games); assert.deepEqual(next.sets[0].clips,old.sets[0].clips);
  next.sets[0].audioRefs[0]='C:/Don.mp3'; assert.deepEqual(B.validateState(JSON.parse(JSON.stringify(next))),next);
  for(const refs of [[], [undefined], new Array(1), ['http://x'], [''], [4]]) { const bad=structuredClone(next);bad.sets[0].audioRefs=refs;assert.throws(()=>B.validateState(bad)); }
  const bad=structuredClone(old);bad.sets[0].audioRefs=[null];assert.throws(()=>B.validateState(bad));
  const multiline=structuredClone(next);multiline.sets[0].songs=['Don\nen vivo'];assert.deepEqual(B.validateState(multiline),multiline);
});
