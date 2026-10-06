import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {openStop,selectStop} from './route-helpers.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
const read = file => JSON.parse(readFileSync(file,'utf8'));
const stories=read('src/data/stories.json'), routes=read('src/data/routes.json');
const english=Object.assign({},...readdirSync('content/i18n').filter(n=>/^en-.*\.json$/.test(n)).sort().map(n=>read('content/i18n/'+n)));
const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
const chinese=/[\u3400-\u9fff]/u;
async function switchTo(page,code){
 await page.locator('.language-trigger').click();
 await page.getByRole('menuitemradio',{name:code==='en'?'English':'中文',exact:true}).click();
 await page.waitForFunction(lang=>document.documentElement.lang===lang,code==='en'?'en':'zh-CN');
}
async function assertEnglish(page,label){
 const leaked=await page.locator('main,footer,.topbar').evaluateAll(nodes=>nodes.flatMap(root=>{
  const hits=[];const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){if(/[\u3400-\u9fff]/u.test(node.textContent))hits.push(node.textContent.slice(0,150));}
  for(const el of root.querySelectorAll('[aria-label],[alt],[placeholder],[title]'))for(const attr of ['aria-label','alt','placeholder','title'])if(/[\u3400-\u9fff]/u.test(el.getAttribute(attr)||''))hits.push(attr+': '+el.getAttribute(attr));
  return hits;
 }));
 assert.deepEqual(leaked,[],label);
}
try{
 const page=await b.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',error=>errors.push(error.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('same key'))errors.push(m.text());});
 await page.route('https://**/*',route=>route.abort());
 await page.goto(base+'#/route/NERD/1');await page.locator('.route-map-page').waitFor();
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 await openStop(page,1);await page.locator('.story-body').waitFor();
 const origin=page.url(), originalTitle=await page.locator('.main-story h2').innerText();
 await page.getByRole('button',{name:'收藏故事',exact:true}).click();
 const stateBefore=await page.evaluate(()=>localStorage.getItem('paris-storymap-v2'));
 await switchTo(page,'en');assert.equal(page.url(),origin);assert.equal(await page.evaluate(()=>localStorage.getItem('paris-storymap-v2')),stateBefore);
 assert.equal(await page.locator('.main-story h2').innerText(),english[originalTitle]);
 await page.locator('.story-extra summary').click();await page.getByRole('button',{name:'Why did this story happen here?',exact:true}).click();await assertEnglish(page,'English question and chapter');
 await page.locator('.sources').evaluate(el=>el.open=true);await assertEnglish(page,'Source panel');
 await page.reload();await page.locator('.main-story').waitFor();assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await page.locator('.main-story>.entity-tags button').filter({hasText:'Jean-Paul Sartre'}).click();await page.locator('.entity-events').waitFor();await assertEnglish(page,'Character branch');
 await page.locator('.entity-preview .primary').click();await page.locator('.branch-banner').waitFor();await assertEnglish(page,'Branch reading');
 await page.getByRole('button',{name:'Back to your chapter',exact:true}).click();assert.equal(page.url(),origin);
 await switchTo(page,'zh');assert.equal(await page.locator('.main-story h2').innerText(),originalTitle);assert.equal(page.url(),origin);
 await switchTo(page,'en');await page.getByRole('button',{name:'Finish this chapter · Next stop',exact:true}).click();
 const progressed=await page.evaluate(()=>localStorage.getItem('paris-storymap-v2'));const nextUrl=page.url();
 await switchTo(page,'zh');await switchTo(page,'en');assert.equal(page.url(),nextUrl);assert.equal(await page.evaluate(()=>localStorage.getItem('paris-storymap-v2')),progressed);
 await page.getByRole('button',{name:'Saved',exact:true}).click();assert(!chinese.test(await page.getByRole('dialog').innerText()));await page.keyboard.press('Escape');
 await page.locator('.route-switch').click();assert.equal(await page.locator('.persona-grid>button').count(),16);assert(!chinese.test(await page.getByRole('dialog').innerText()));await page.keyboard.press('Escape');
 for(const route of routes){await page.goto(base+'#/route/'+route.persona_id+'/0');await page.locator('.route-map-page').waitFor();assert.equal(await page.locator('h1').innerText(),english[route.title]);await assertEnglish(page,'Route '+route.persona_id);await page.locator('.offline-map-pin').first().click();await assertEnglish(page,'Selected card '+route.persona_id);}
 for(const story of stories){
  await page.goto(base+'#/poi/'+story.poi_id+'/'+story.id+'?route=NERD&chapter=0&context=browse');await page.locator('.story-body').waitFor();
  assert.equal((await page.locator('.story-body').innerText()).replace(/\s+/g,' ').trim(),(english[story.body]||story.body).replace(/\s+/g,' ').trim(),story.id+' full body');
  await assertEnglish(page,'Story '+story.id);
 }
 await page.getByRole('button',{name:'Explore places',exact:true}).click();await page.locator('.poi-grid').waitFor();await assertEnglish(page,'Place library');assert.equal(await page.locator('.poi-library-card').count(),118);
 await page.getByRole('textbox',{name:'Search places, people or works'}).fill('Hemingway');assert.ok(await page.locator('.poi-library-card').count()>0);
 const englishSearchCount=await page.locator('.poi-library-card').count();await switchTo(page,'zh');assert.equal(await page.locator('.poi-library-card').count(),englishSearchCount);await switchTo(page,'en');
 await page.getByRole('textbox',{name:'Search places, people or works'}).fill('Café de Flore');assert.ok(await page.locator('.poi-library-card').count()>0);
 await page.getByRole('textbox',{name:'Search places, people or works'}).fill('不存在的place');assert.equal(await page.locator('.poi-library-card').count(),0);
 await page.goto(base+'#/route/NERD/7');await openStop(page,7);await page.getByRole('button',{name:'Finish this chapter and see your recap',exact:true}).click();assert(!chinese.test(await page.getByRole('dialog').innerText()));await page.keyboard.press('Escape');
 await page.goto(base+'#/route/NERD/0');await page.locator('.route-map-page').waitFor();await page.screenshot({path:'artifacts/language-desktop-en.png',fullPage:true});
 const missingPhoto=await b.newPage();
 await missingPhoto.addInitScript(()=>localStorage.setItem('paris-storymap-language','en'));
 await missingPhoto.route('https://**/*',route=>route.abort());
 await missingPhoto.route('**/photos/editions-gallimard.webp',route=>route.abort());
 await missingPhoto.goto(base+'#/route/NERD/0');await openStop(missingPhoto,0);await missingPhoto.locator('.archive-art').waitFor();assert(!chinese.test(await missingPhoto.locator('.archive-art').innerText()));await missingPhoto.close();
 // Keyboard menu, focus restoration, and selection semantics.
 await page.locator('.language-trigger').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.getByRole('menuitemradio',{name:'English',exact:true}).getAttribute('aria-checked'),'true');await page.keyboard.press('Home');await page.keyboard.press('Enter');assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');assert(await page.locator('.language-trigger').evaluate(el=>el===document.activeElement));
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await switchTo(page,'en');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile route width '+width);
  await page.locator('.language-trigger').click();await page.screenshot({path:`artifacts/language-menu-${width}.png`});await page.keyboard.press('Escape');
  await openStop(page,1);await page.locator('.main-story').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile chapter width '+width);
  await page.screenshot({path:`artifacts/language-story-${width}.png`,fullPage:true});
  await page.goto(base+'#/route/NERD/0');await page.locator('.route-map-page').waitFor();
 }
 // Storage refusal must not prevent changing or reading the language.
 const restricted=await b.newPage();await restricted.route('https://**/*',r=>r.abort());
 await restricted.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};});
 await restricted.goto(base+'#/route/NERD/0');await restricted.locator('.route-map-page').waitFor();await switchTo(restricted,'en');assert.equal(await restricted.locator('html').getAttribute('lang'),'en');await restricted.close();
 assert.deepEqual(errors,[]);
 writeFileSync('artifacts/language-result.json',JSON.stringify({passed:true,routes:routes.length,stories:stories.length,libraryPlaces:118,mobileWidths:[390,320],checks:['all rendered content and accessibility labels English','full story bodies retained','question and source panels','character branches and return URL','saved state and read progress retained','preference survives reload','English and accent-insensitive search','all dialogs','keyboard menu and focus','storage unavailable fallback'],pageErrors:errors},null,2)+'\n');
 console.log('Global language checks passed: 16 routes, 260 full stories, library, state, keyboard, 390/320px mobile.');
}finally{await b.close();}
