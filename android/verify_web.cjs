// Exercise the exact APK assets at the intercepted local HTTPS origin.
const {chromium}=require('../qa/runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../.android-build/assets/app');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[],requests=[];
 const check=(value,name)=>{assert.ok(value,name);checks.push(name);};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());requests.push(url.href);
   if(url.origin!=='https://appassets.androidplatform.net'||!url.pathname.startsWith('/app/'))throw new Error('Unexpected network dependency: '+url.href);
   const file=path.resolve(root,url.pathname.slice(5));assert.ok(file.startsWith(root+path.sep));
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
   await route.fulfill({status:200,contentType:types[path.extname(file)]||'text/plain',body:fs.readFileSync(file)});
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://appassets.androidplatform.net/app/index.html',{waitUntil:'networkidle'});await page.waitForSelector('.district');
  check(await page.locator('.district').count()===64,'All 64 packaged districts');check(!(await page.locator('#map-loading').isVisible()),'Packaged startup completes');
  check(!(await page.locator('#app-recovery').isVisible()),'No startup error');check(await page.locator('#install').count()===0,'No website installer');
  await page.locator('#directory [data-district=Dhaka]').click();check(await page.locator('#detail h2').textContent()==='Dhaka','District selection');
  const before=await page.locator('#geography').getAttribute('transform');await page.locator('#zoom-in').click();check(await page.locator('#geography').getAttribute('transform')!==before,'Map zoom');await page.locator('#zoom-reset').click();
  for(const [layer,count] of [['gi',64],['communities',20],['places',12],['nature',10]]){await page.locator(`[data-layer=${layer}]`).click();check(await page.locator('.directory-item').count()===count,'Packaged '+layer+' directory');}
  await page.locator('[data-layer=history]').click();await page.locator('#timeline-slider').press('Home');check((await page.locator('#timeline-date').textContent()).includes('3rd century'),'First timeline stop');await page.locator('#timeline-slider').press('End');check((await page.locator('#timeline-date').textContent()).includes('June 2026'),'Last timeline stop');
  await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'All 91 packaged facts');await page.locator('[data-save=fact-1]').click();await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.fact-card');check(await page.locator('#saved-count').textContent()==='1','Saved cards survive reload');
  await page.locator('#practice').click();check(await page.locator('[data-answer]').count()===4,'Packaged practice questions');await page.locator('[data-answer="0"]').click();check((await page.locator('#quiz-feedback').textContent()).length>0,'Practice answer feedback');await page.locator('#quiz-dialog [data-close]').click();
  await page.locator('[data-tab=syllabus]').click();check(await page.locator('.syllabus-card').count()===14,'Both syllabi, 14 topics');await page.locator('.source-images summary').click();check(await page.locator('.source-images img').evaluateAll(xs=>xs.every(x=>x.complete&&x.naturalWidth>0)),'Original syllabus images included');
  check(await page.evaluate(()=>document.fonts.check('16px AtlasBangla')),'Bengali font available');check(!requests.some(u=>/\.geojson|\.json|sw\.js|manifest/.test(u)),'No data fetch, service worker or manifest requests');
  check(errors.length===0,'No packaged runtime errors');
  await page.locator('[data-tab=map]').click();await page.locator('[data-layer=districts]').click();await page.locator('#clear').click();await page.screenshot({path:path.resolve(__dirname,'../.android-build/apk-webview-preview.png'),fullPage:true});
  fs.writeFileSync(path.resolve(__dirname,'../.android-build/web-results.json'),JSON.stringify({checks:checks.length,results:checks,requests,errors},null,2));console.log(checks.length+' APK web-content checks passed without a website or data downloads.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
