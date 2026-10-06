import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
const quiz=JSON.parse(readFileSync('content/personality-quiz.json','utf8'));
const personas=JSON.parse(readFileSync('src/data/personas.json','utf8'));
const routes=JSON.parse(readFileSync('src/data/routes.json','utf8'));
const base=process.env.DEMO_URL||'http://127.0.0.1:5175/';
const key='paris-storymap-quiz-v1';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true});
const errors=[];
async function answer(page,index,step){
 await page.locator('.quiz-option').nth(index).click();
 if(step<=4)await page.waitForFunction(n=>document.querySelector('.quiz-question-number')?.textContent===`0${n}`,step);
 else await page.locator('.quiz-persona').waitFor();
}
async function noHan(page){assert(!/[\u3400-\u9fff]/u.test(await page.locator('main').innerText()));}
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());
 await page.goto(base+'#/route/BLUE/2');
 const reading={reading:{NERD:{'cafe-de-flore--stove-writing':'read'}},saved:['route:NERD']};
 await page.evaluate(state=>localStorage.setItem('paris-storymap-v2',JSON.stringify(state)),reading);await page.reload();
 await page.locator('.route-switch').click();await page.locator('.quiz-entry').click();await page.locator('.quiz-option').first().waitFor();
 assert.equal(await page.locator('.quiz-option').count(),3);
 assert.match(await page.locator('h1').innerText(),/看到一个地方/);
 await page.screenshot({path:'artifacts/quiz-question-zh.png'});
 // Two synchronous clicks must only answer the current question once.
 await page.locator('.quiz-option').nth(2).evaluate(button=>{button.click();button.click();});
 await page.waitForFunction(()=>document.querySelector('.quiz-question-number')?.textContent==='02');
 assert.equal(await page.evaluate(k=>Object.keys(JSON.parse(localStorage.getItem(k)).answers).length,key),1);
 await page.getByRole('button',{name:'上一题',exact:true}).click();
 assert.equal(await page.locator('.quiz-option[aria-pressed=true]').innerText().then(x=>x.includes('谁在这儿')),true);
 await answer(page,2,2);await answer(page,2,3);
 await page.locator('.language-trigger').click();await page.getByRole('menuitemradio',{name:'English',exact:true}).click();
 await noHan(page);await page.reload();await page.locator('.quiz-option').first().waitFor();
 assert.match(await page.locator('h1').innerText(),/ideal way to explore/);
 await answer(page,0,4);
 assert.equal(await page.locator('.quiz-persona').count(),0);
 await answer(page,0,5);
 assert.equal(await page.locator('.quiz-persona').getAttribute('data-persona'),'NERD');
 assert.equal(await page.locator('.quiz-traits>div').count(),4);await noHan(page);
 assert.match(page.url(),/quiz\/result/);
 await page.locator('.quiz-route-photo img').evaluate(img=>img.decode());
 await page.screenshot({path:'artifacts/quiz-result-en.png',fullPage:true});
 await page.reload();await page.locator('.quiz-persona').waitFor();await noHan(page);
 await page.getByRole('button',{name:'Edit my answers',exact:true}).click();
 assert.equal(await page.locator('.quiz-option[aria-pressed=true]').count(),1);
 await answer(page,2,5);
 assert.equal(await page.locator('.quiz-persona').getAttribute('data-persona'),'BLUE');
 await page.locator('.quiz-open-route').click();await page.locator('.route-map-page').waitFor();
 assert.match(page.url(),/route\/BLUE\/0/);assert.equal(await page.locator('.route-poi-card').count(),0);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('paris-storymap-v2'))),reading);
 // Exercise every distinct result and its route link through actual UI choices.
 for(const persona of personas){
  await page.goto(base+'#/quiz/result');await page.locator('.quiz-persona').waitFor();
  await page.getByRole('button',{name:'Retake the quiz',exact:true}).click();
  for(let i=0;i<quiz.questions.length;i++)await answer(page,persona.dimensions[quiz.questions[i].dimension]*2,i+2);
  assert.equal(await page.locator('.quiz-persona').getAttribute('data-persona'),persona.id);await noHan(page);
  const route=routes.find(r=>r.id===persona.default_route_id);
  assert(route);await page.locator('.quiz-open-route').click();await page.locator('.route-map-page').waitFor();
  assert.match(page.url(),new RegExp('route/'+route.persona_id+'/0'));
  assert.equal(await page.locator('.route-poi-card').count(),0);
 }
 // Mid-range options stay visible as such, rather than being described as extremes.
 await page.goto(base+'#/quiz/result');await page.getByRole('button',{name:'Retake the quiz',exact:true}).click();
 for(let i=0;i<4;i++)await answer(page,1,i+2);
 assert.match(await page.locator('.quiz-traits').innerText(),/Little stories/);
 assert.match(await page.locator('.quiz-traits').innerText(),/A few close friends/);
 assert.match(await page.locator('.quiz-description').innerText(),/one or two close friends/);
 assert(!/No plan and no wish/.test(await page.locator('.quiz-description').innerText()));
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`artifacts/quiz-result-mobile-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Retake the quiz',exact:true}).click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`artifacts/quiz-question-mobile-${width}.png`,fullPage:true});
  for(let i=0;i<4;i++)await answer(page,0,i+2);
 }
 // A result URL with missing/corrupt answers returns to the quiz, never an invented persona.
 await page.evaluate(k=>localStorage.setItem(k,'{broken'),key);await page.reload();
 await page.locator('.quiz-options').waitFor();assert.equal(await page.locator('.quiz-persona').count(),0);
 assert.match(await page.locator('.quiz-question-number').innerText(),/01/);
 const blocked=await browser.newPage({viewport:{width:390,height:844}});
 blocked.on('pageerror',e=>errors.push(e.message));
 await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
 await blocked.goto(base+'#/quiz');for(let i=0;i<4;i++)await answer(blocked,2,i+2);
 assert.equal(await blocked.locator('.quiz-persona').getAttribute('data-persona'),'GOAT');
 assert.deepEqual(errors,[]);
 writeFileSync('artifacts/quiz-browser-report.json',JSON.stringify({passed:true,personas:16,questions:4,checks:['original questions','auto advance','double click lock','previous answer','language switch','refresh','edit and rescore','all result routes','no initial POI card','reading and bookmarks preserved','middle preference labels','mobile 390/320','corrupt storage','blocked storage'],errors},null,2)+'\n');
 console.log('Quiz browser checks passed: 4 questions, all 16 results and route links, bilingual persistence, edits, mobile and storage fallbacks.');
}finally{await browser.close();}
