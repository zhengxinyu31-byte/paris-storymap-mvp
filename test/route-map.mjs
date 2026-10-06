import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const routes=JSON.parse(readFileSync('src/data/routes.json','utf8'));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('https://tiles.openfreemap.org/styles/positron',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({version:8,sources:{},layers:[{id:'paper',type:'background',paint:{'background-color':'#e4e8db'}}]})}));
 await page.goto(base+'#/route/NERD/0');await page.locator('.route-map-page').waitFor({timeout:3000});
 assert.equal(await page.locator('.timeline,.more-routes,.route-poi-card').count(),0);
 await page.locator('.map-marker').last().waitFor();assert.equal(await page.locator('.map-marker').count(),8);
 assert.equal(await page.locator('.map-label').innerText(),'按数字顺序游览');
 const map=await page.locator('.route-map-stage').boundingBox();assert(map.width>1200&&map.height>550);
 await page.locator('.map-marker').nth(1).click();await page.locator('.route-poi-card').waitFor();assert.equal(await page.locator('.route-poi-card').count(),1);assert.match(await page.locator('.route-poi-card').innerText(),/花神/);assert.equal(await page.locator('.route-poi-card img').count(),1);
 await page.locator('.language-trigger').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();assert(!/[\u3400-\u9fff]/u.test(await page.locator('main').innerText()));assert.equal(await page.locator('.map-marker.selected').innerText(),'2');
 await page.locator('.route-poi-card .read-story').click();await page.locator('.main-story').waitFor();assert.match(page.url(),/cafe-de-flore/);await page.locator('.back-link').click();await page.locator('.route-poi-card').waitFor();assert.match(await page.locator('.route-poi-card').innerText(),/Café de Flore/);
 await page.getByRole('button',{name:'Close place card'}).click();assert.equal(await page.locator('.route-poi-card').count(),0);assert.equal(await page.locator('.map-marker.selected').count(),0);
 await page.locator('.map-marker').nth(3).click();assert.equal(await page.locator('.route-poi-card').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('.route-poi-card').count(),0);
 await page.screenshot({path:'artifacts/route-map-desktop.png'});
 await page.goto(base+'#/route/BUDD/0');await page.locator('.map-marker').last().waitFor();assert.equal(await page.locator('.map-marker').count(),6);await page.locator('.map-marker').first().click();for(let i=0;i<5;i++)await page.getByRole('button',{name:'Next place',exact:true}).click();assert.match(await page.locator('.route-poi-card h2').innerText(),/Piaf/);assert.equal(await page.locator('.map-marker.selected').count(),1);
 const offline=await browser.newPage({viewport:{width:390,height:844}});offline.on('pageerror',e=>errors.push(e.message));await offline.route('https://**/*',r=>r.abort());
 for(const route of routes){
  await offline.goto(base+'#/route/'+route.persona_id+'/0');await offline.locator('.route-map-page').waitFor();assert.equal(await offline.locator('.route-poi-card').count(),0);
  const first=offline.locator('.offline-map-pin').first();await first.waitFor();assert.equal(await offline.locator('.overview-route line').count(),route.stops.length-1,route.persona_id+' ordered offline connections');await first.click();
  await offline.locator('.route-poi-card').waitFor();assert.equal(await offline.locator('.route-poi-card').count(),1);
  assert.equal(await offline.locator('.overview-route line').first().evaluate(el=>getComputedStyle(el).strokeDasharray),'none');
  for(let index=0;index<route.stops.length-1;index++){
   assert.equal(await offline.locator('.route-next-leg small').count(),0);
   const directions=await offline.locator('.route-next-leg a').getAttribute('href');assert.equal(new URL(directions).searchParams.has('travelmode'),false);
   await offline.getByRole('button',{name:'下一个地点',exact:true}).click();
  }
  const missing=offline.locator('.unlocated-places summary');if(await missing.count()){await missing.click();await offline.locator('.unlocated-places button').first().click();assert.match(await offline.locator('.route-poi-card').innerText(),/地图位置待核实/);}
  assert(await offline.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route.persona_id+' mobile overflow');
 }
 await offline.goto(base+'#/route/NERD/0');await offline.locator('.offline-map-pin').nth(1).click();await offline.screenshot({path:'artifacts/route-map-mobile.png'});
 await offline.locator('.language-trigger').click();await offline.getByRole('menuitemradio',{name:'English',exact:true}).click();await offline.setViewportSize({width:320,height:740});assert(await offline.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await offline.screenshot({path:'artifacts/route-map-mobile-en.png'});
 assert.deepEqual(errors,[]);writeFileSync('artifacts/route-map-result.json',JSON.stringify({passed:true,routes:16,checks:['map dominates route page','no initial POI cards or list','pin opens exactly one photo/story card','close and Escape','reading and return preserve selected POI','language switching','mobile and map outage','unlocated POIs remain accessible without invented coordinates'],pageErrors:errors},null,2));console.log('Map-first route checks passed');
}finally{await browser.close();}
