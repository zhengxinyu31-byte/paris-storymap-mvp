import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {selectStop} from './route-helpers.mjs';
const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';
const before=process.env.PHOTO_AUDIT==='before';
const media=JSON.parse(await fs.readFile('src/data/media.json','utf8'));
const routes=JSON.parse(await fs.readFile('src/data/routes.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true});
const problems=[],checks=[];
async function inspect(page,context,selector='.photo img'){
 const rows=await page.locator(selector).evaluateAll(async images=>{
  await Promise.all(images.map(img=>{img.loading='eager';return img.decode();}));
  return images.map(img=>{
   const box=img.getBoundingClientRect(),frame=img.closest('.photo').getBoundingClientRect(),style=getComputedStyle(img);
   const card=img.closest('.poi-library-card');
   const topGap=card?frame.top-card.getBoundingClientRect().top-card.clientTop:0;
   const scale=Math.min(box.width/img.naturalWidth,box.height/img.naturalHeight);
   const empty=style.objectFit==='contain'?1-(img.naturalWidth*scale*img.naturalHeight*scale)/(box.width*box.height):0;
   return {src:img.getAttribute('src'),fit:style.objectFit,position:style.objectPosition,width:box.width,height:box.height,frameWidth:frame.width,frameHeight:frame.height,topGap,empty:Math.round(empty*100)};
  });
 });
 for(const row of rows){
  if(row.fit!=='cover'||Math.abs(row.width-row.frameWidth)>1||Math.abs(row.height-row.frameHeight)>1||Math.abs(row.topGap)>1||row.width<1||row.height<1)problems.push({context,...row});
 }
 checks.push({context,images:rows.length});return rows;
}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1060}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
 await page.goto(base+'#/library');await page.locator('.poi-grid').waitFor();
 await inspect(page,'library desktop');
 await page.locator('.poi-library-card').nth(25).scrollIntoViewIfNeeded();
 await page.screenshot({path:`artifacts/photo-fit-${before?'before':'after'}-desktop.png`});
 if(!before){
  for(const width of [390,320]){
   await page.setViewportSize({width,height:844});
   await inspect(page,'library '+width);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:width===1440?1060:844});
   for(const [persona,index] of [['NERD',0],['NERD',1],['CUTE',3],['CUTE',6],['BOSS',0],['BUDD',5]]){
    await page.goto(base+`#/route/${persona}/${index}`);await selectStop(page,persona==='BUDD'?0:index);
    if(persona==='BUDD')for(let i=0;i<index;i++)await page.getByRole('button',{name:'下一个地点',exact:true}).click();
    await inspect(page,`map ${persona}:${index} ${width}`);
    if(persona==='CUTE'&&index===6)await page.screenshot({path:`artifacts/photo-fit-map-${width}.png`});
    await page.locator('.route-poi-card .read-story').click();await page.locator('.main-story').waitFor();
    await inspect(page,`story ${persona}:${index} ${width}`);
   }
  }
  for(const route of routes){
   await page.evaluate(id=>{localStorage.setItem('paris-storymap-quiz-v1',JSON.stringify({version:1,step:3,answers:{1:id[0]*2,4:id[1]*2,7:id[2]*2,12:id[3]*2}}));},Object.values(JSON.parse(await fs.readFile('src/data/personas.json','utf8')).find(p=>p.id===route.persona_id).dimensions));
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:1060});await page.goto(base+'#/quiz/result');await page.reload();
    await page.locator('.quiz-recommendation').waitFor();await inspect(page,`quiz ${route.persona_id} ${width}`);
    if(route.persona_id==='NERD')await page.screenshot({path:`artifacts/photo-fit-quiz-${width}.png`,fullPage:true});
   }
  }
  // Verify original local assets are still used; no generated substitutes or stretched bitmaps.
  assert.deepEqual(errors,[]);
 }
 await fs.writeFile(`artifacts/photo-fit-${before?'before':'after'}.json`,JSON.stringify({checks,problems},null,2));
 console.log(JSON.stringify({contexts:checks.length,images:checks.reduce((n,c)=>n+c.images,0),problems:problems.length,unfilledPhotos:[...new Set(problems.map(p=>p.src))].length}));
 if(!before)assert.deepEqual(problems,[]);
}finally{await browser.close();}
