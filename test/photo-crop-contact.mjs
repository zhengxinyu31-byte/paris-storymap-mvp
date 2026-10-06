import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const media=JSON.parse(await fs.readFile('src/data/media.json','utf8'));
const base=process.env.DEMO_URL||'http://127.0.0.1:5175';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1030},deviceScaleFactor:1});
 const entries=Object.entries(media);
 for(let i=0;i<entries.length;i+=20){
  await page.setContent(`<style>body{margin:12px;background:#eee;font:12px Arial}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.cell{background:white;padding:7px;overflow:hidden}.frames{display:flex;gap:6px;height:150px}.wide{flex:1;min-width:0}.narrow{width:62px;flex-shrink:0}img{width:100%;height:100%;object-fit:cover;display:block}.label{display:block;padding-top:8px;min-height:26px}</style><div class="grid">${entries.slice(i,i+20).map(([id,m])=>`<div class="cell"><div class="frames"><div class="wide"><img src="${base}${m.src}" style="object-position:${m.crop?.landscape||'50% 50%'}"></div><div class="narrow"><img src="${base}${m.src}" style="object-position:${m.crop?.portrait||'50% 50%'}"></div></div><span class="label">${id}</span></div>`).join('')}</div>`);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  await page.screenshot({path:`artifacts/photo-crops-${i/20+1}.jpg`,fullPage:true,quality:90});
 }
 console.log('119 photos rendered as wide and narrow crops across 6 contact sheets.');
}finally{await browser.close();}
