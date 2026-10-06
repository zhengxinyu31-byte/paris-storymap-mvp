import assert from 'node:assert/strict';
import {chromium, webkit} from '@playwright/test';
const base = process.env.DEMO_URL || 'http://127.0.0.1:5175/';
const safari = process.env.TEST_BROWSER === 'webkit';
const browser = await (safari ? webkit : chromium).launch(safari ? {} : {
  executablePath: process.env.CHROME_PATH || (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined),
  headless: true,
});
try {
  for (const touch of [false, true]) {
    const page = await browser.newPage({viewport:{width:touch ? 390 : 1280,height:844},hasTouch:touch});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);
    if (!safari) {
      // Reproduce browsers that blur the selected item without focusing the clicked button.
      await page.evaluate(()=>document.addEventListener('mousedown',event=>{
        if(event.target.closest('[role="menuitemradio"]')) {
          event.preventDefault(); document.activeElement.blur();
        }
      },true));
    }
    const select = async name => {
      const trigger=page.locator('.language-trigger');
      await (touch ? trigger.tap() : trigger.click());
      const item=page.getByRole('menuitemradio',{name,exact:true});
      await (touch ? item.tap() : item.click());
    };
    await select('English');
    assert.equal(await page.locator('html').getAttribute('lang'),'en','English selection must survive focus loss before click');
    assert.equal(await page.locator('[role="menu"]').count(),0);
    await page.reload(); await page.locator('.language-trigger').waitFor();
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    await select('中文');
    assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
    await page.locator('.language-trigger').click();
    await page.keyboard.press('End'); await page.keyboard.press('Enter');
    assert.equal(await page.locator('html').getAttribute('lang'),'en');
    await page.locator('.language-trigger').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('[role="menu"]').count(),0);
    await page.locator('.language-trigger').click(); await page.locator('h1').click();
    assert.equal(await page.locator('[role="menu"]').count(),0);
    await page.locator('.language-trigger').click();
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    assert.equal(await page.locator('[role="menu"]').count(),0,'Tab leaving menu closes it');
    assert.deepEqual(errors,[]);
    await page.close();
  }
  console.log(`Language focus regression passed (${safari?'WebKit':'Chromium with null-focus reproduction'}; desktop and touch).`);
} finally { await browser.close(); }
