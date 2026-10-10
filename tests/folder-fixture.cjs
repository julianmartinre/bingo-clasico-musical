const fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'artifacts','folder-fixtures');fs.mkdirSync(base,{recursive:true});
async function uploadSongs(page, songs) {
  const folder=fs.mkdtempSync(path.join(base,'set-'));
  songs.forEach((_,i)=>fs.writeFileSync(path.join(folder,`${i+1}.mp3`),'fixture'));
  await page.locator('#songs-folder').setInputFiles(folder);
  await page.locator('#music-card-size').fill(String(Math.min(15,Math.max(1,Math.floor(songs.length/6)))));
  for(let i=0;i<songs.length;i++)await page.locator('.folder-song input:not([type=checkbox])').nth(i).fill(songs[i]);
}
module.exports={uploadSongs};
