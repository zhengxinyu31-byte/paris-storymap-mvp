import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {openStop,selectStop} from './route-helpers.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const media=JSON.parse(await fs.readFile('src/data/media.json','utf8'));
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';const errors=[];
try{const p=await b.newPage({viewport:{width:1440,height:1060}});p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());await p.goto(base+'#/route/NERD/0');await p.locator('.route-map-page').waitFor();
 const decoded=await p.evaluate(async list=>{const result=[];for(const [id,m] of list){const img=new Image();img.src=m.src;await img.decode();result.push({id,width:img.naturalWidth,height:img.naturalHeight})}return result},Object.entries(media));assert.equal(decoded.length,119);for(const img of decoded)assert.ok(img.width>150&&img.height>150,img.id);
 assert.equal(await p.locator('.route-poi-card img').count(),0);await selectStop(p,0);assert.equal(await p.locator('.route-poi-card img').count(),1);await p.locator('.route-poi-card img').evaluate(im=>im.decode());await p.screenshot({path:'artifacts/photos-route-desktop.png'});
 await p.locator('.route-poi-card .read-story').click();await p.locator('.reading-column>.photo img').waitFor();await p.locator('.reading-column>.photo img').evaluate(im=>im.decode());assert.ok(await p.locator('.reading-column>.photo a').first().getAttribute('href'));await p.screenshot({path:'artifacts/photos-poi-desktop.png'});
 await p.getByRole('button',{name:'探索地点'}).click();await p.locator('.poi-grid').waitFor();assert.equal(await p.locator('.poi-library-card img').count(),118);await p.locator('.poi-library-card img').first().evaluate(im=>im.decode());await p.locator('.poi-library-card').first().scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/photos-library-desktop.png'});
 await p.setViewportSize({width:390,height:844});await p.locator('.poi-library-card').first().scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/photos-library-mobile.png'});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 // A local photo failure retains a legible fallback and does not break story navigation.
 const q=await b.newPage();q.on('pageerror',e=>errors.push(e.message));await q.route('https://**/*',r=>r.abort());await q.route('**/photos/editions-gallimard.webp',r=>r.abort());await q.goto(base+'#/route/NERD/0');await q.locator('.route-map-page').waitFor();await openStop(q,0);await q.locator('.reading-column>.photo .archive-art').waitFor();assert.match(await q.locator('.archive-art small').innerText(),/照片暂时未能加载/);assert.ok(await q.locator('.story-body').isVisible());assert.deepEqual(errors,[]);
 await fs.writeFile('artifacts/photos-browser-result.json',JSON.stringify({decoded:decoded.length,libraryCards:118,routePhotosOnDemand:1,desktop:true,mobile:true,externalNetworkBlocked:true,fallback:true,pageErrors:errors},null,2));console.log('PASS: 119 images decoded, 118 library cards, route photos, desktop/mobile and failure fallback');
}finally{await b.close()}
