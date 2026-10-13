// Test the actual deployed HTTPS app in fresh Chrome, including a scoped recovery.
const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=(process.env.SITE_URL||'https://ascendesshady.github.io/Bangladesh-Affairs/').replace(/\/?$/,'/');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
 const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
 try{
  const api=await browser.newContext({serviceWorkers:'block'});let manifest;
  for(let attempt=0;attempt<12;attempt++){
   const response=await api.request.get(base+'deployment.json?check='+Date.now());
   if(response.ok()){
    const candidate=await response.json();
    if(!process.env.GITHUB_SHA||candidate.commit===process.env.GITHUB_SHA){manifest=candidate;break;}
   }
   await new Promise(r=>setTimeout(r,3000));
  }
  check(!!manifest,'Public deployment manifest matches this commit');
  for(const [file,expected] of Object.entries(manifest.files)){
   const response=await api.request.get(base+file+'?check='+Date.now());check(response.ok(),'Live asset responds: '+file);
   check(crypto.createHash('sha256').update(await response.body()).digest('hex')===expected,'Live asset matches deployed bytes: '+file);
  }
  await api.close();
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:{width:mobile?390:1440,height:1100},isMobile:mobile,hasTouch:mobile});const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>{if(r.failure().errorText!=='net::ERR_ABORTED')errors.push(r.url()+': '+r.failure().errorText);});
   await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('.district');await page.waitForFunction(()=>navigator.serviceWorker.controller);
   check(await page.locator('body').getAttribute('data-release')===manifest.release,'Current release in '+(mobile?'phone':'desktop'));
   check(await page.locator('.district').count()===64,'64 live districts '+mobile);check(!(await page.locator('#map-loading').isVisible()),'Loading finishes '+mobile);
   check(!(await page.locator('#app-recovery').isVisible()),'No startup recovery error '+mobile);
   if(mobile)check(await page.locator('.tabs').evaluate(e=>e.parentElement===document.body),'Phone navigation is outside header');
   await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'91 live facts '+mobile);await page.locator('[data-save=fact-1]').click();
   await page.goto(base+'?repair=1#facts',{waitUntil:'networkidle'});await page.waitForURL(url=>!url.searchParams.has('repair'),{waitUntil:'networkidle'});await page.waitForSelector('.fact-card');
   check(await page.locator('#saved-count').textContent()==='1','Recovery preserves saved cards '+mobile);await page.waitForFunction(()=>navigator.serviceWorker.controller);
   const cached=await page.evaluate(async release=>{const key=(await caches.keys()).find(k=>k.endsWith('v'+release));return (await (await caches.open(key)).keys()).length;},manifest.release);
   check(cached===22,'All offline runtime assets saved '+mobile);
   await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.fact-card');check(await page.locator('.fact-card').count()===91,'Facts work offline '+mobile);
   await page.locator('[data-tab=map]').click();check(await page.locator('.district').count()===64,'Map works offline '+mobile);await context.setOffline(false);
   if(!mobile){
    await page.waitForFunction(()=>{const nav=document.querySelector('.tabs'),a=nav.querySelector('.active'),s=getComputedStyle(nav,'::before');return Math.abs(new DOMMatrixReadOnly(s.transform).m41-a.offsetLeft)<1;});
    fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});await page.screenshot({path:path.join(__dirname,'screenshots/live-deployment.png')});
   }
   await context.close();
  }
  check(errors.length===0,'No runtime or unexpected failed requests: '+errors.join('; '));
  fs.writeFileSync(path.join(__dirname,'live-results.json'),JSON.stringify({commit:manifest.commit,release:manifest.release,checks:checks.length,results:checks,errors},null,2));
  console.log(`${checks.length} live checks passed for ${manifest.commit}: public assets, desktop, phone, recovery and offline use.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
