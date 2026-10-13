const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),checks=[];
const check=(value,label)=>{assert.ok(value,label);checks.push(label);};
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2'};
let release='old',legacyRef='3e189fb';const oldFiles=new Map();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');let file=url.pathname.replace(/^\/bangladesh-affairs\//,'');if(!file)file='index.html';
 if(file.includes('..')){res.writeHead(403).end();return;}
 try{
  let bytes;
  if(release==='old'){
   const key=legacyRef+':'+file;
   if(!oldFiles.has(key))oldFiles.set(key,execFileSync('git',['show',key],{cwd:root,maxBuffer:10*1024*1024,stdio:['ignore','pipe','ignore']}));
   bytes=oldFiles.get(key);
  }else bytes=fs.readFileSync(path.join(root,file));
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
 }catch{res.writeHead(404).end('Not found');}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/bangladesh-affairs/`;let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
  page.on('pageerror',e=>console.error('Runtime:',e.message));page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('.district');await page.waitForFunction(()=>navigator.serviceWorker.controller);
  await page.evaluate(()=>{localStorage.setItem('ba-saved','["fact-1"]');localStorage.setItem('ba-explored','["Dhaka"]');});
  release='new';await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.district');
  if(process.argv.includes('--diagnose')){
   console.log(JSON.stringify(await page.evaluate(async()=>({districts:document.querySelectorAll('.district').length,navParent:document.querySelector('.tabs').parentElement.tagName,hasGlass:!!document.querySelector('link[href="./assets/glass.css"]'),cachedAppIncludesGlass:(await (await (await caches.open((await caches.keys())[0])).match(new URL('assets/app.js',location.href))).text()).includes('initGlassControls')})),null,2));return;
  }
  await page.waitForFunction(()=>document.body.dataset.release==='1.1.1'&&document.querySelector('.tabs').parentElement===document.body);
  check(await page.locator('.district').count()===64,'Legacy installation updates to matching page and script');
  const keys=await page.evaluate(()=>caches.keys());check(keys.length===1&&keys[0].endsWith('v1.1.1'),'Obsolete app cache removed');
  check(await page.evaluate(()=>localStorage.getItem('ba-saved')==='["fact-1"]'&&localStorage.getItem('ba-explored')==='["Dhaka"]'),'Update preserves study progress');
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.district');check(await page.locator('.district').count()===64,'Updated installation opens offline');
  await page.locator('#reload-app').click();check(await page.locator('#app-recovery').isVisible(),'Offline repair asks to reconnect');check((await page.evaluate(()=>caches.keys())).length===1,'Offline repair retains usable cache');await context.setOffline(false);
  await page.evaluate(async()=>{await (await caches.open('unrelated-app-cache')).put('./other',new Response('keep'));});
  await page.goto(base+'?repair=1',{waitUntil:'networkidle'});await page.waitForURL(url=>!url.searchParams.has('repair'),{waitUntil:'networkidle'});await page.waitForSelector('.district');await page.waitForFunction(()=>navigator.serviceWorker.controller);
  check(!(await page.url()).includes('repair='),'Recovery link finishes without a reload loop');
  check(await page.evaluate(async()=>!!(await (await caches.open('unrelated-app-cache')).match('./other'))),'Repair preserves unrelated app caches');
  check(await page.evaluate(()=>localStorage.getItem('ba-saved')==='["fact-1"]'),'Repair preserves saved cards');
  // A failed startup must give the user an actionable recovery control.
  for(const asset of ['app.js','content.js','vendor/d3.min.js']){
   const broken=await browser.newContext({serviceWorkers:'block'});await broken.route('**/assets/'+asset,r=>r.abort());const brokenPage=await broken.newPage();await brokenPage.goto(base,{waitUntil:'networkidle'});await brokenPage.waitForSelector('#app-recovery:not([hidden])');
   check(await brokenPage.locator('#recovery-retry').isVisible(),asset+' failure exposes repair button');await broken.close();
  }
  const badData=await browser.newContext({serviceWorkers:'block'});await badData.route('**/assets/data/districts.geojson',r=>r.fulfill({status:503,body:'Unavailable'}));const badPage=await badData.newPage();await badPage.goto(base,{waitUntil:'networkidle'});await badPage.waitForSelector('#app-recovery:not([hidden])');check((await badPage.locator('#app-recovery').textContent()).includes('could not load'),'Data failure exposes recovery message');await badData.close();
  const badStorage=await browser.newContext({serviceWorkers:'block'});await badStorage.addInitScript(()=>{localStorage.setItem('ba-saved','123');localStorage.setItem('ba-explored','{}');});const badStoragePage=await badStorage.newPage();await badStoragePage.goto(base,{waitUntil:'networkidle'});await badStoragePage.waitForSelector('.district');check(await badStoragePage.locator('.district').count()===64,'Unexpected saved-state types do not freeze startup');await badStorage.close();
  legacyRef='34e293b';release='old';const glassContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),glassPage=await glassContext.newPage();await glassPage.goto(base,{waitUntil:'networkidle'});await glassPage.waitForSelector('.district');await glassPage.waitForFunction(()=>navigator.serviceWorker.controller);
  release='new';await glassPage.reload({waitUntil:'networkidle'});await glassPage.waitForFunction(()=>document.body.dataset.release==='1.1.1');await glassPage.waitForSelector('.district');check(await glassPage.evaluate(async()=>{const keys=await caches.keys();return keys.length===1&&keys[0].endsWith('v1.1.1');}),'Glass release also upgrades to the repaired release');await glassContext.close();
  fs.writeFileSync(path.join(__dirname,'loading-results.json'),JSON.stringify({checks:checks.length,results:checks},null,2));console.log(`${checks.length} loading, legacy update, offline and recovery checks passed.`);
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
