export async function selectStop(page,index){
 await page.locator('.route-map-page').waitFor();
 if(await page.locator('.route-poi-card').count())await page.locator('.route-card-close').click();
 await page.locator(`.route-map-page [data-stop-index="${index}"]:visible`).first().click();
 await page.locator('.route-poi-card').waitFor();
}
export async function openStop(page,index){await selectStop(page,index);await page.locator('.route-poi-card .read-story').click();await page.locator('.main-story').waitFor();}
