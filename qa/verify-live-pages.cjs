const {chromium}=require('./runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site=path.resolve(root,'../GitHub-Pages'),base='https://ascendesshady.github.io/Bangladesh-Affairs/';
(async()=>{
 const checks=[],errors=[],check=(value,name)=>{assert.ok(value,name);checks.push(name);};
 for(const name of ['index.html','sw.js','assets/offline.js','assets/style.css','assets/glass.css']){
  const response=await fetch(base+name,{cache:'no-store'});check(response.ok,'Live '+name+' serves successfully');
  const text=await response.text(),local=fs.readFileSync(path.join(site,name),'utf8');check(text.replace(/\r\n/g,'\n')===local.replace(/\r\n/g,'\n'),'Live '+name+' matches verified package');
 }
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('.district');await page.waitForFunction(()=>navigator.serviceWorker.controller);
  check(await page.locator('body').getAttribute('data-release')==='1.3.0','Live release is v1.3.0');
  check(await page.locator('.district').count()===64&&!await page.locator('#app-recovery').isVisible(),'Live map starts with 64 districts');
  const cdp=await context.newCDPSession(page),point=(x,y,id)=>({x,y,id,radiusX:8,radiusY:8,force:1});
  const send=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  await page.locator('#map').scrollIntoViewIfNeeded();let r=await page.locator('#map').boundingBox(),x=r.x+r.width*.6,y=r.y+r.height*.5;
  const before=await page.locator('#geography').getAttribute('transform'),scroll=await page.evaluate(()=>scrollY);
  await send('touchStart',[point(x,y+55,0)]);for(let i=1;i<=8;i++){await send('touchMove',[point(x,y+55-i*14,0)]);await page.waitForTimeout(20);}await send('touchEnd',[]);await page.waitForTimeout(250);
  check(await page.evaluate(()=>scrollY)>scroll+30&&await page.locator('#geography').getAttribute('transform')===before,'Live one-finger swipe scrolls the page, leaving the map unchanged');
  await page.locator('#map').scrollIntoViewIfNeeded();r=await page.locator('#map').boundingBox();x=r.x+r.width*.6;y=r.y+r.height*.5;
  await send('touchStart',[point(x-40,y,0),point(x+40,y,1)]);for(let i=1;i<=8;i++)await send('touchMove',[point(x-40-i*5,y,0),point(x+40+i*5,y,1)]);await send('touchEnd',[]);
  check(await page.locator('#geography').evaluate(el=>el.transform.baseVal.consolidate().matrix.a>1.8),'Live two-finger pinch zooms the map');
  await page.locator('[data-layer=places]').click();check(await page.locator('.directory-item').count()===32,'Live 32 historic and important places');
  await page.locator('#place-type').selectOption('mosques');check(await page.locator('.marker').count()===9,'Live nine historic mosque markers');
  await page.locator('#directory [data-record=place-22]').click();check(await page.locator('#detail h2').textContent()==='Bagha Mosque','Live historic mosque details');
  await page.locator('#place-type').selectOption('parks');check(await page.locator('.marker').count()===5,'Live five park and garden markers');
  await page.locator('#directory [data-record=place-30]').click();check(await page.locator('#detail h2').textContent()==='Suhrawardy Udyan','Live udyan details');
  await page.locator('[data-layer=districts]').click();const dhaka=page.locator('.district[aria-label^="Dhaka district,"]');await dhaka.focus();await dhaka.press('Enter');
  check(await dhaka.evaluate(e=>getComputedStyle(e).outlineStyle==='none'&&parseFloat(getComputedStyle(e).strokeWidth)>=3),'Live district selection has a border without a rectangular box');
  await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'Live 91 facts');
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.fact-card');check(await page.locator('.fact-card').count()===91,'Live release reloads offline');
  await page.locator('[data-tab=map]').click();check(await page.locator('.district').count()===64,'Live cached map offline');
  check(errors.length===0,'No live runtime errors');
  fs.writeFileSync(path.join(root,'.android-build/live-pages-results.json'),JSON.stringify({url:base,checks:checks.length,results:checks,errors},null,2));console.log(checks.length+' live Pages checks passed, including real touch and offline reload.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
