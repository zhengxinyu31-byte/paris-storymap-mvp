import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
const photos=JSON.parse(await fs.readFile('src/data/media.json','utf8'));
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true});
try{const p=await b.newPage({viewport:{width:1280,height:1400},deviceScaleFactor:1});const entries=Object.entries(photos);for(let i=0;i<entries.length;i+=20){await p.setContent(`<style>body{margin:12px;background:#eee;font:12px Arial}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.cell{height:260px;background:white;padding:5px;overflow:hidden}img{width:100%;height:230px;object-fit:contain}span{display:block}</style><div class="grid">${entries.slice(i,i+20).map(([id,m])=>`<div class="cell"><img src="http://127.0.0.1:5175${m.src}"><span>${id}</span></div>`).join('')}</div>`);await p.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(im=>im.decode())));await p.screenshot({path:`artifacts/photos-contact-${i/20+1}.jpg`,quality:85,fullPage:true});console.log('sheet',i/20+1)}}finally{await b.close()}
