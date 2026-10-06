import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts',{recursive:true});
const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true});
try{
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.route('https://**/*',r=>r.abort());
 await p.goto(base);await p.locator('.quiz-option').first().waitFor();assert.equal(await p.locator('.route-map-page').count(),0);
 await p.screenshot({path:'artifacts/journey-first-visit.png',fullPage:true});
 for(let i=0;i<4;i++){
  await p.locator('.quiz-option').nth([2,2,0,0][i]).click();
  if(i<3)await p.waitForFunction(n=>document.querySelector('.quiz-question-number')?.textContent===`0${n}`,i+2);else await p.locator('.quiz-persona').waitFor();
 }
 await p.locator('.quiz-open-route').click();await p.locator('.start-route').click();assert.match(await p.locator('.route-card-number').innerText(),/01/);
 assert.equal(await p.locator('.topbar nav>button').count(),3);
 await p.getByRole('button',{name:'下一个地点',exact:true}).click();await p.locator('.route-poi-card .read-story').click();
 await p.locator('.main-story').waitFor();const main=p.url();
 assert.equal(await p.locator('.story-extra[open],.same-place-stories[open],.route-alternatives[open]').count(),0);
 assert((await p.locator('.read-actions').boundingBox()).y<(await p.locator('.supporting-people').boundingBox()).y);
 await p.screenshot({path:'artifacts/journey-main-story.png',fullPage:true});
 await p.locator('.same-place-stories summary').click();await p.locator('.other-stories>button').first().click();await p.locator('.branch-banner').waitFor();
 await p.reload();await p.getByRole('button',{name:'返回原来章节',exact:true}).click();assert.equal(p.url(),main);
 await p.getByRole('button',{name:'收藏故事',exact:true}).click();
 await p.getByRole('button',{name:'读完这一章，前往下一站',exact:true}).click();await p.locator('.route-poi-card').waitFor();assert.match(p.url(),/route\/NERD\/2/);assert.match(await p.locator('.route-card-number').innerText(),/03/);
 await p.reload();await p.locator('.start-route').waitFor();assert.match(await p.locator('.start-route').innerText(),/第 3 站/);
 await p.getByRole('button',{name:'探索地点',exact:true}).click();await p.getByRole('textbox',{name:'搜索地点、人物或作品'}).fill('波伏娃');
 assert.equal(await p.locator('.library-storylines,.quiz-entry').count(),0);
 await p.locator('.poi-library-card').first().click();await p.locator('.main-story').waitFor();await p.reload();await p.getByRole('button',{name:'回到探索地点',exact:true}).click();assert.equal(await p.getByRole('textbox',{name:'搜索地点、人物或作品'}).inputValue(),'波伏娃');
 await p.getByRole('button',{name:'我的收藏',exact:true}).click();await p.locator('.modal .result-card').first().click();await p.locator('.main-story').waitFor();await p.reload();await p.getByRole('button',{name:'返回我的收藏',exact:true}).click();await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'我的路线',exact:true}).click();assert.match(p.url(),/route\/NERD\/2/);
 await p.goto(base);await p.locator('.route-map-page').waitFor();assert.match(await p.locator('.start-route').innerText(),/第 3 站/);
 // A resumed route at the root URL must share a real route link for a new visitor.
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.sharedJourneyUrl=value;}}}));
 await p.getByRole('button',{name:'分享路线',exact:true}).click();
 const shared=await p.evaluate(()=>window.sharedJourneyUrl);assert.match(shared,/#\/route\/NERD\/2$/);
 const visitor=await b.newPage();await visitor.route('https://**/*',r=>r.abort());await visitor.goto(shared);await visitor.locator('.route-map-page').waitFor();assert.equal(await visitor.locator('.quiz-option').count(),0);await visitor.close();
 await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('unavailable');}}}));
 await p.getByRole('button',{name:'分享路线',exact:true}).click();assert.equal(await p.locator('.share-input').inputValue(),shared);await p.keyboard.press('Escape');
 // An explicit alternate route starts at this shared POI, not its unrelated first chapter.
 await p.goto(base+'#/route/NERD/1');await p.locator('.offline-map-pin[data-stop-index="1"]').click();await p.locator('.read-story').click();await p.locator('.route-alternatives summary').click();await p.locator('.related-routes button').filter({hasText:'TIME'}).click();await p.locator('.route-poi-card').waitFor();assert.match(p.url(),/route\/TIME\/3/);assert.match(await p.locator('.route-poi-card h2').innerText(),/花神/);
 // Read the ending out of order: recap still points back to the unread chapters.
 await p.goto(base+'#/route/NERD/7');await p.locator('.offline-map-pin[data-stop-index="7"]').click();await p.locator('.read-story').click();await p.getByRole('button',{name:'读完这一章，看看回顾',exact:true}).click();await p.getByRole('button',{name:'继续未读的章节',exact:true}).click();await p.locator('.route-poi-card').waitFor();assert.match(p.url(),/route\/NERD\/0/);
 for(const width of [390,320]){
  await p.setViewportSize({width,height:844});await p.getByRole('button',{name:'我的路线',exact:true}).click();
  await p.locator('.language-trigger').click();await p.getByRole('menuitemradio',{name:'English',exact:true}).click();
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(!/[\u3400-\u9fff]/u.test(await p.locator('main').innerText()));
  await p.screenshot({path:`artifacts/journey-map-${width}.png`});
  await p.locator('.start-route').click();await p.locator('.read-story').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`artifacts/journey-story-${width}.png`,fullPage:true});
  await p.locator('.language-trigger').click();await p.getByRole('menuitemradio',{name:'中文',exact:true}).click();
 }
 assert.deepEqual(errors,[]);writeFileSync('artifacts/journey-result.json',JSON.stringify({passed:true,checks:['first visit quiz','one recommended route','route start CTA','collapsed supplementary stories','story returns to next map card','active route survives side trips and reload','search return retains query','saved story returns to saved list','shared POI route switch','unfinished recap','bilingual mobile 390/320'],errors},null,2));console.log('Journey checks passed');
}finally{await b.close();}
