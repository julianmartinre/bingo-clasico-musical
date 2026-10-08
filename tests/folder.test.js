const { test } = require('node:test'), assert = require('node:assert/strict');
const B = require('../js/domain.js');
const f = (path, size=10) => ({ name:path.split('/').at(-1), webkitRelativePath:path, size, lastModified:1, type:'' });
test('carpeta: extensiones, orden natural, títulos, homónimos y exclusiones', () => {
  const files = ['Musica/A/10.MP3','Musica/A/2.mp3','Musica/A/tema.wav','Musica/B/tema.wav','Musica/01 - Ártista.vivo.flac','Musica/a.png'].map(p=>f(p));
  files.push(f('Musica/vacío.mp3',0), f('Musica/../no.mp3'));
  const r=B.folderSongs(files);assert.equal(r.rows.length,5);assert.equal(r.ignored.length,3);
  assert(r.rows.findIndex(x=>x.title==='2')<r.rows.findIndex(x=>x.title==='10'));
  assert.equal(r.rows[0].title,'01 - Ártista.vivo');assert.equal(r.rows.filter(x=>x.title==='tema').length,2);
  assert.deepEqual(B.folderSongs([...files].reverse()).rows.map(r=>r.relativePath),r.rows.map(r=>r.relativePath));
  for(const ext of ['ogg','oga','m4a','aac','opus','webm']) assert.equal(B.folderSongs([f('M/a.'+ext)]).rows.length,1);
  assert.equal(B.folderSongs([files[0],files[0]]).rows.length,1);
  assert.throws(()=>B.folderSongs([files[0],{...files[0],size:20}]),/repetidas/);
});
test('edición, movimientos y exclusiones conservan identidad y snapshot', () => {
  const one=f('M/A.mp3'), two=f('M/B.mp3');let rows=B.folderSongs([one,two]).rows;
  rows[1].title='Renombrada';rows=B.moveFolderSong(rows,rows[1].id,-1);
  assert.equal(rows[0].file,two);assert.equal(rows[0].relativePath,'M/B.mp3');
  rows[1].included=false;const selected=B.folderSelection(rows);assert.equal(selected.length,1);assert.equal(selected[0].file,two);
  rows[0].title='Otra';assert.equal(selected[0].title,'Renombrada');
  rows[0].title=' ';assert.throws(()=>B.folderSelection(rows),/títulos/);
  rows[0].included=false;assert.throws(()=>B.folderSelection(rows),/Incluí/);
  assert.equal(B.moveFolderSong(rows,rows[0].id,-1),rows);
  assert.equal(B.folderSongs([f('M/.mp3')]).rows[0].title,'');
});
