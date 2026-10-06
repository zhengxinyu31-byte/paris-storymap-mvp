import {mkdirSync as ensureArtifactDirectory} from 'node:fs';
ensureArtifactDirectory('artifacts',{recursive:true});
import {chromium} from '@playwright/test';
const b=await chromium.launch({executablePath:process.env.CHROME_PATH||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':undefined),headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const p=await b.newPage({viewport:{width:1440,height:1060}});await p.goto('http://127.0.0.1:5175/');await p.locator('.timeline').waitFor();await p.waitForTimeout(17000);await p.screenshot({path:'artifacts/route-preview.png'});await p.locator('.timeline li').nth(1).getByRole('button',{name:'读这则故事'}).click();await p.locator('.main-story>.entity-tags button').filter({hasText:'波伏娃'}).first().click();await p.locator('.entity-events').waitFor();await p.waitForTimeout(2500);await p.screenshot({path:'artifacts/person-preview.png'});console.log({mapReady:await p.locator('.map-overview').count(),url:p.url()});await p.setViewportSize({width:390,height:844});await p.screenshot({path:'artifacts/person-mobile-preview.png'});
}finally{await b.close()}
