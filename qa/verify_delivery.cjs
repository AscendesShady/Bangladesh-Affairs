const {chromium}=require('./runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),site=path.resolve(root,path.basename(root)==='Reproduce'?'../GitHub-Pages':'GitHub-Pages'),checks=[];
const check=(value,name)=>{assert.ok(value,name);checks.push(name);};
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain'};
const server=http.createServer((req,res)=>{let name=new URL(req.url,'http://localhost').pathname.replace(/^\/Bangladesh-Affairs\//,'');if(!name)name='index.html';const file=path.resolve(site,name);if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/Bangladesh-Affairs/`,profile=fs.mkdtempSync(path.join(root,'.android-build/delivery-profile-'));let context;const errors=[];
 try{
  context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'networkidle'});await page.waitForSelector('.district');await page.waitForFunction(()=>navigator.serviceWorker.controller);
  check(await page.locator('.district').count()===64,'Public package: 64 districts');check(!await page.locator('#app-recovery').isVisible(),'Public package startup');
  for(const [width,height] of [[320,640],[390,844],[844,390],[800,1280],[1280,800],[1600,1000]]){
   await page.setViewportSize({width,height});
   for(const tab of ['map','facts','syllabus']){await page.locator(`[data-tab=${tab}]`).click();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${tab} fits ${width}x${height}`);}
   check(await page.locator('#install').isVisible(),`Install control available ${width}x${height}`);
  }
  await page.locator('[data-tab=map]').click();await page.locator('#directory [data-district=Dhaka]').click();check(await page.locator('#detail h2').textContent()==='Dhaka','Public selection');
  await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'91 public facts');await page.locator('[data-tab=syllabus]').click();check(await page.locator('.syllabus-card').count()===14,'14 public topics');
  const cdp=await context.newCDPSession(page);check((await cdp.send('Page.getAppManifest')).errors.length===0,'Manifest parses');check((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors.length===0,'Chrome installability');
  check(await page.evaluate(async()=>{const key=(await caches.keys()).find(k=>k.endsWith('v1.2.1'));return (await (await caches.open(key)).keys()).length===13;}),'13 offline entries cached');
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.syllabus-card');await page.locator('[data-tab=map]').click();check(await page.locator('.district').count()===64,'Offline public map');await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'Offline public facts');await context.setOffline(false);
  check(errors.length===0,'No public package runtime errors');
  fs.writeFileSync(path.join(root,'.android-build/public-results.json'),JSON.stringify({checks:checks.length,results:checks,errors},null,2));console.log(checks.length+' GitHub-Pages package checks passed, including installation and offline reload.');
 }finally{if(context)await context.close();await new Promise(r=>server.close(r));const clean=path.resolve(profile);assert.ok(clean.startsWith(path.resolve(root,'.android-build')+path.sep)&&path.basename(clean).startsWith('delivery-profile-'));fs.rmSync(clean,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
