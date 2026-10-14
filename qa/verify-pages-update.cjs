// Verify a currently cached public release upgrades without losing saved cards.
const {chromium}=require('./runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),old=path.join(root,'.android-build/pages-repo'),current=path.resolve(root,'../GitHub-Pages');
let site=old;
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.woff2':'font/woff2'};
const previous=new Map();
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.replace(/^\/Bangladesh-Affairs\//,'')||'index.html',file=path.resolve(site,name);if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}try{let bytes;if(site===old){if(!previous.has(name))previous.set(name,execFileSync('git',['show','59721c2:'+name],{cwd:root,maxBuffer:16*1024*1024,stdio:['ignore','pipe','ignore']}));bytes=previous.get(name);}else bytes=fs.readFileSync(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain','Cache-Control':'no-store'});res.end(bytes);}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const checks=[],errors=[];
 const check=(value,name)=>{assert.ok(value,name);checks.push(name);};
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/Bangladesh-Affairs/`,{waitUntil:'networkidle'});await page.waitForSelector('.district');await page.waitForFunction(()=>navigator.serviceWorker.controller);
  check(await page.locator('body').getAttribute('data-release')==='1.1.1','Old published release loads and caches');
  await page.locator('[data-tab=facts]').click();await page.locator('[data-save=fact-1]').click();
  site=current;await page.reload({waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.body.dataset.release==='1.2.1'&&document.querySelectorAll('.district').length===64,{},{timeout:45000});
  check(!await page.locator('#app-recovery').isVisible(),'Cached session upgrades to bundled Pages release');
  check(await page.locator('#saved-count').textContent()==='1','Saved card retained through update');
  check(await page.evaluate(async()=>{const keys=(await caches.keys()).filter(k=>k.startsWith('bangladesh-affairs:'));return keys.length===1&&keys[0].endsWith('v1.2.1');}),'Old cache replaced with complete v1.2.1 shell');
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.district',{state:'attached'});
  check(await page.locator('.district').count()===64,'Updated map loads offline');
  await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'Updated facts load offline');
  check(errors.length===0,'No upgrade runtime errors');
  fs.writeFileSync(path.join(root,'.android-build/pages-update-results.json'),JSON.stringify({checks:checks.length,results:checks,errors},null,2));console.log(checks.length+' cached Pages upgrade checks passed.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
