const {chromium}=require('./runtime.cjs');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 process.env.PORT='0';const server=require('./serve.cjs');await new Promise(r=>server.once('listening',r));
 const url=`http://127.0.0.1:${server.address().port}/bangladesh-affairs/`;
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(url,{waitUntil:'networkidle'});
 await page.waitForSelector('.district');fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
 await page.screenshot({path:path.join(__dirname,'screenshots/desktop.png'),fullPage:true});
 console.log(JSON.stringify({title:await page.title(),paths:await page.locator('.district').count(),facts:await page.locator('.fact-card').count(),serviceWorker:await page.evaluate(()=>navigator.serviceWorker.controller?.scriptURL),errors},null,2));
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(__dirname,'screenshots/mobile.png'),fullPage:true});
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exitCode=1;});