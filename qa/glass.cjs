const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 process.env.PORT='0';const server=require('./serve.cjs');await new Promise(r=>server.once('listening',r));let browser;
 const checks=[],errors=[];const check=(ok,label)=>{assert.ok(ok,label);checks.push(label);};
 const snapshots=path.join(__dirname,'screenshots');fs.mkdirSync(snapshots,{recursive:true});
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/bangladesh-affairs/`,{waitUntil:'networkidle'});await page.waitForSelector('.district');
  const settle=()=>page.waitForFunction(()=>{const nav=document.querySelector('.tabs'),active=nav.querySelector('.active'),p=getComputedStyle(nav,'::before');return Math.abs(parseFloat(p.width)-active.offsetWidth)<1&&Math.abs(new DOMMatrixReadOnly(p.transform).m41-active.offsetLeft)<1;});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const tab of ['map','facts','syllabus']){
    await page.locator(`[data-tab=${tab}]`).click();await settle();
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${tab} fits ${width}px`);
    const indicator=await page.locator('.tabs').evaluate(nav=>{const p=getComputedStyle(nav,'::before'),a=nav.querySelector('.active');return {width:parseFloat(p.width),targetWidth:a.offsetWidth,x:new DOMMatrixReadOnly(p.transform).m41,targetX:a.offsetLeft};});
    check(Math.abs(indicator.width-indicator.targetWidth)<1&&Math.abs(indicator.x-indicator.targetX)<1,`${tab} glass indicator at ${width}px`);
   }
   await page.locator('[data-tab=map]').click();await settle();
   const navBox=await page.locator('.tabs').boundingBox();
   if(width<=700){
    check(await page.locator('.tabs').evaluate(n=>n.parentElement===document.body),'Phone dock is isolated from blurred header at '+width);
    check(navBox.y>700&&navBox.y+navBox.height<=900,'Phone dock at viewport bottom '+width);
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));check(Math.abs((await page.locator('.tabs').boundingBox()).y-navBox.y)<1,'Dock stays fixed while scrolling '+width);
    const footer=await page.locator('footer').boundingBox();check(footer.y+footer.height>=navBox.y+navBox.height,'Footer provides dock clearance '+width);
    await page.locator('#about').click();check(await page.locator('#sources-dialog').isVisible(),'Header remains reachable '+width);await page.locator('#sources-dialog [data-close]').click();
   }else check(await page.locator('.tabs').evaluate(n=>n.parentElement.classList.contains('app-header')),'Desktop navigation stays in header '+width);
   await page.evaluate(()=>window.scrollTo(0,0));
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-tab=map]').click();await settle();
  console.log('Indicator:',await page.locator('.tabs').evaluate(n=>({style:n.getAttribute('style'),pseudo:getComputedStyle(n,'::before').width})));
  await page.screenshot({path:path.join(snapshots,'glass-desktop.png'),fullPage:true});
  await page.locator('[data-tab=facts]').click();await page.locator('[data-topic=climate]').click();await settle();await page.screenshot({path:path.join(snapshots,'glass-facts.png'),fullPage:true});
  const solid=await page.locator('.fact-card').first().evaluate(el=>getComputedStyle(el).backgroundColor);check(solid==='rgb(252, 253, 251)','Reading cards remain opaque');
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tab=map]').click();await settle();await page.screenshot({path:path.join(snapshots,'glass-mobile.png'),fullPage:true});
  await page.locator('[data-layer=history]').click();await page.locator('#timeline-slider').press('End');check(await page.locator('#timeline-slider').evaluate(el=>el.style.getPropertyValue('--history-progress'))==='100%','Glass history fill follows slider');await page.locator('#timeline-slider').press('Home');check(await page.locator('#timeline-slider').evaluate(el=>el.style.getPropertyValue('--history-progress'))==='0%','Glass slider minimum fill');await page.locator('#timeline-slider').press('ArrowRight');
  await page.locator('#timeline-panel').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(snapshots,'glass-history-mobile.png'),fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce',contrast:'more'});await settle();
  const accessible=await page.locator('.tabs').evaluate(n=>({blur:getComputedStyle(n).backdropFilter,background:getComputedStyle(n).backgroundColor,transition:getComputedStyle(n,'::before').transitionDuration}));
  check(accessible.blur==='none'&&accessible.background==='rgb(252, 253, 251)','More-contrast uses solid navigation');check(accessible.transition.split(',').every(d=>parseFloat(d)===0),'Reduced motion stops pill animation');
  check(errors.length===0,'No glass-design runtime errors');
  fs.writeFileSync(path.join(__dirname,'glass-results.json'),JSON.stringify({count:checks.length,checks,errors},null,2));console.log(`${checks.length} liquid-glass layout and accessibility checks passed.`);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
