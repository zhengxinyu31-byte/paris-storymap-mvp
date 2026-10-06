import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1440,height:1000}});p.on('console',m=>{if(m.type()==='error')console.log(m.text().slice(0,250))});p.on('requestfailed',r=>console.log('FAILED',r.url().slice(0,120),r.failure()?.errorText));await p.goto('http://127.0.0.1:5174');await p.waitForTimeout(16000);console.log('markers',await p.locator('.map-marker').count());await p.screenshot({path:'artifacts/map-live.png'});await b.close();
