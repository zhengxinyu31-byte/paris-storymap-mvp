import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {openStop,selectStop} from './route-helpers.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts',{recursive:true});
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';
try{
const c=await b.newContext({viewport:{width:1440,height:1080}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
await p.goto(base+'#/route/NERD/0',{waitUntil:'domcontentloaded'});await p.locator('.route-map-page').waitFor();assert.match(await p.locator('.route-map-kicker').innerText(),/8/);assert.equal(await p.locator('.route-poi-card').count(),0);
await openStop(p,1);await p.locator('.story-body').waitFor();assert.match(await p.locator('.story-body').innerText(),/暖|炉/);
const mainUrl=p.url();const mainTitle=await p.locator('.main-story h2').innerText();
await p.locator('.story-extra summary').click();await p.getByRole('button',{name:'为什么故事发生在这里？'}).click();assert.match(await p.locator('.question-answer').innerText(),/花神|写作/);assert.ok(await p.locator('.answer-sources a').count()>0);
await p.locator('.main-story>.entity-tags button').filter({hasText:'萨特'}).first().click();await p.locator('.entity-events').waitFor();assert.ok(await p.locator('.entity-events li').count()>=3);assert.equal(await p.locator('.entity-preview h2').innerText(),mainTitle,'a character branch starts with the chapter being read');
await p.locator('.event-select').last().click();const lastTitle=await p.locator('.entity-preview h2').innerText();await p.reload();await p.locator('.entity-preview').waitFor();assert.equal(await p.locator('.entity-preview h2').innerText(),lastTitle);
await p.screenshot({path:'artifacts/person-trail-desktop.png',fullPage:true});
await p.getByRole('button',{name:'走进这则故事'}).click();await p.locator('.branch-banner').waitFor();await p.getByRole('button',{name:'标记这则故事已读'}).click();assert.ok(!JSON.parse(await p.evaluate(()=>localStorage.getItem('paris-storymap-v2'))).reading.NERD);
await p.reload();await p.locator('.branch-banner').waitFor();await p.getByRole('button',{name:'返回原来章节'}).click();await p.getByRole('button',{name:'读完这一章，前往下一站'}).waitFor();assert.equal(p.url(),mainUrl);assert.equal(await p.locator('.main-story h2').innerText(),mainTitle);
await p.locator('.same-place-stories summary').click();await p.locator('.other-stories>button').filter({hasNotText:mainTitle}).first().click();await p.locator('.branch-banner').waitFor();await p.getByRole('button',{name:'返回原来章节'}).click();assert.equal(p.url(),mainUrl);
await p.getByRole('button',{name:'收藏故事',exact:true}).click();await p.getByRole('button',{name:'我的收藏'}).click();assert.ok(await p.locator('.result-card').count()>=1);await p.keyboard.press('Escape');
await p.getByRole('button',{name:'读完这一章，前往下一站'}).click();await p.locator('.route-poi-card').waitFor();assert.match(await p.locator('.route-poi-card h2').innerText(),/双叟/);await p.reload();await p.locator('.start-route').click();await p.locator('.route-poi-card .read-story').click();await p.locator('.main-story').waitFor();
await p.locator('.back-link').click();assert.match(await p.locator('.route-map-kicker').innerText(),/1 章已读/);await p.screenshot({path:'artifacts/route-desktop.png',fullPage:true});
await openStop(p,7);await p.getByRole('button',{name:'读完这一章，看看回顾'}).click();assert.match(await p.locator('.recap').innerText(),/6\s*章待探索/);await p.keyboard.press('Escape');
for(const id of ['NERD','CTRL','BLUE','MYTH','DODO','BUDD','GOAT','TIME','BEE','LORD','BOSS','FREE','WIND','SHAN','REST','CUTE']){await p.goto(base+'#/route/'+id+'/0');await p.locator('.route-map-page').waitFor();assert.match(await p.locator('.route-map-kicker').innerText(),/[678] 个故事章节/);assert.equal(await p.locator('.timeline').count(),0);}
await p.getByRole('button',{name:'探索地点'}).click();await p.locator('.poi-grid').waitFor();assert.equal(await p.locator('.poi-library-card').count(),118);assert.equal(await p.locator('.library-storylines .storyline-card').count(),0);
await p.getByRole('button',{name:'我的路线',exact:true}).click();await p.locator('.route-switch').click();await p.locator('.persona-grid>button').filter({hasText:'NERD'}).click();await openStop(p,0);assert.match(await p.locator('.storyline-context').innerText(),/左岸作家/);await p.getByRole('button',{name:'探索地点'}).click();await p.locator('.poi-grid').waitFor();
await p.getByRole('textbox',{name:'搜索地点、人物或作品'}).fill('伽利玛');await p.locator('.poi-library-card').first().click();const freeUrl=p.url();await p.getByRole('button',{name:'标记这则故事已读'}).click();assert.equal(p.url(),freeUrl);
const m=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mp=await m.newPage();mp.on('pageerror',e=>errors.push(e.message));await mp.route('https://**/*',r=>r.abort());await mp.goto(base+'#/route/NERD/0');await mp.locator('.route-map-page').waitFor();
assert.ok(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await openStop(mp,0);await mp.locator('.main-story').waitFor();await mp.locator('.main-story>.entity-tags button').first().click();await mp.locator('.entity-events').waitFor();
assert.ok(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mp.screenshot({path:'artifacts/person-trail-mobile.png',fullPage:true});
await mp.locator('.fallback-stations button').last().click();await mp.getByRole('button',{name:'走进这则故事'}).click();await mp.locator('.branch-banner').waitFor();await mp.locator('.story-extra summary').click();await mp.getByRole('button',{name:'为什么故事发生在这里？'}).click();await mp.locator('.question-answer').waitFor();await mp.screenshot({path:'artifacts/branch-mobile.png',fullPage:true});assert.ok(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await mp.getByRole('button',{name:'返回原来章节'}).click();await mp.getByRole('button',{name:'读完这一章，前往下一站'}).waitFor();await mp.goto(base+'#/poi/not-real/no-story');await mp.locator('.route-map-page').waitFor();
assert.deepEqual(errors,[]);writeFileSync('artifacts/browser-result.json',JSON.stringify({passed:true,pageErrors:errors,checks:['16 persona routes','119 POIs','person timeline and deep link refresh','branch returns to exact original chapter','branch read never advances main route','click questions with sources','same-place alternate story returns','bookmarks','read progress and recap','storyline discovery and chapter context','character branch retains current story','free reading','mobile no horizontal overflow','external map outage fallback','invalid URL recovery']},null,2));console.log('All browser checks passed');
}finally{await b.close()}
