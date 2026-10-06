import {chromium} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const routes=JSON.parse(readFileSync('src/data/routes.json','utf8'));
 for(const route of routes){
  await page.goto('http://127.0.0.1:4175/#/route/'+route.persona_id+'/0');
  await page.locator('.map-marker').last().waitFor({timeout:25000});
  assert.equal(await page.locator('.map-marker').count(),route.stops.length);
  assert.equal(await page.locator('.expanded-map').getAttribute('data-visible-legs'),String(route.stops.length-1));
  if(['NERD','BUDD','BLUE'].includes(route.persona_id))await page.screenshot({path:`artifacts/connections-${route.persona_id}.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:4175/#/route/BLUE/0');await page.locator('.map-marker').last().waitFor();await page.locator('.map-marker').first().click();await page.locator('.route-next-leg a').waitFor();
 const href=await page.locator('.route-next-leg a').getAttribute('href');assert(new URL(href).searchParams.get('origin'));await page.screenshot({path:'artifacts/connections-mobile.png'});
 await page.locator('.language-trigger').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();assert(!/[\u3400-\u9fff]/u.test(await page.locator('.route-next-leg').innerText()));
 assert.deepEqual(errors,[]);console.log('16 live maps: every ordered connection present; next-leg navigation and bilingual mobile card passed');
}finally{await browser.close();}
