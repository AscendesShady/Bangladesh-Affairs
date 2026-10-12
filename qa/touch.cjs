const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 process.env.PORT='0';const server=require('./serve.cjs');await new Promise(r=>server.once('listening',r));let browser;
 const results=[],errors=[];const check=(ok,name)=>{assert.ok(ok,name);results.push(name);};
 try{
  browser=await chromium.launch({channel:'chrome',headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}/bangladesh-affairs/`,{waitUntil:'networkidle'});await page.waitForSelector('.district');
  const cdp=await context.newCDPSession(page);
  const transform=()=>page.locator('#geography').evaluate(el=>{const m=el.transform.baseVal.consolidate()?.matrix;return {k:m?.a??1,x:m?.e??0,y:m?.f??0};});
  const point=(x,y,id)=>({x,y,id,radiusX:8,radiusY:8,force:1});
  const send=(type,touchPoints)=>Promise.race([cdp.send('Input.dispatchTouchEvent',{type,touchPoints}),new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Touch input timed out: '+type)),10000);timer.unref();})]);
  async function twoFinger(start,end){
   await send('touchStart',start.map((p,i)=>point(...p,i)));
   for(let step=1;step<=8;step++)await send('touchMove',start.map((p,i)=>point(p[0]+(end[i][0]-p[0])*step/8,p[1]+(end[i][1]-p[1])*step/8,i)));
   await send('touchEnd',[]);
  }
  for(const layer of ['districts','gi','communities','places','nature','history']){
   console.log('Testing touch layer: '+layer);
   await page.locator(`[data-layer=${layer}]`).click();await page.locator('#zoom-reset').click();await page.locator('#map').scrollIntoViewIfNeeded();
   const r=await page.locator('#map').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
   const scroll=await page.evaluate(()=>scrollY),detail=await page.locator('#detail h2').textContent();
   await twoFinger([[x-40,y],[x+40,y]],[[x-80,y],[x+80,y]]);
   let t=await transform();check(t.k>1.8&&t.k<2.2,`${layer}: native two-finger pinch zooms map`);
   const before=t;
   await twoFinger([[x-40,y],[x+40,y]],[[x-5,y+25],[x+75,y+25]]);
   t=await transform();check(Math.abs(t.k-before.k)<.05,`${layer}: two-finger pan preserves scale`);
   check(t.x-before.x>20&&t.y-before.y>15,`${layer}: two-finger horizontal and vertical pan`);
   check(await page.evaluate(()=>Math.abs(visualViewport.scale-1)<.01),`${layer}: page does not pinch-zoom`);
   check(await page.evaluate(()=>scrollY)===scroll,`${layer}: map gesture does not scroll page`);
   check(await page.locator('#detail h2').textContent()===detail,`${layer}: gesture does not select a district`);
   await twoFinger([[x-80,y],[x+80,y]],[[x-40,y],[x+40,y]]);check((await transform()).k<before.k-.5,`${layer}: pinch inward zooms out`);
  }
  await page.locator('#zoom-reset').click();await page.locator('#map').scrollIntoViewIfNeeded();
  const r=await page.locator('#map').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;
  await page.mouse.move(x,y);await page.mouse.wheel(24,35);let t=await transform();check(t.k===1,'Trackpad scrolling keeps zoom level');check(Math.abs(t.x)>5&&Math.abs(t.y)>5,'Trackpad scrolling pans both axes');
  const before=t.k;await page.keyboard.down('Control');await page.mouse.wheel(0,-50);await page.keyboard.up('Control');await page.waitForTimeout(200);check((await transform()).k>before,'Trackpad Ctrl-wheel pinch zoom');
  await page.keyboard.down('Control');await page.mouse.wheel(0,-1000);await page.keyboard.up('Control');await page.waitForTimeout(200);check((await transform()).k===9,'Maximum touch/trackpad zoom limit');
  await page.keyboard.down('Control');await page.mouse.wheel(0,1000);await page.keyboard.up('Control');await page.waitForTimeout(200);check((await transform()).k===1,'Minimum touch/trackpad zoom limit');
  await page.locator('#zoom-in').click();check((await transform()).k>1,'Zoom controls still work');await page.locator('#zoom-reset').click();check((await transform()).k===1,'Reset control still works');
  await send('touchStart',[point(x,y,0)]);await send('touchMove',[point(x+30,y+20,0)]);await send('touchCancel',[]);
  const cancelled=await transform();await twoFinger([[x-40,y],[x+40,y]],[[x-60,y],[x+60,y]]);check((await transform()).k>cancelled.k,'Gesture recovers after touch cancellation');
  check(errors.length===0,'No touch or passive-listener errors');
  fs.writeFileSync(path.join(__dirname,'touch-results.json'),JSON.stringify({checks:results.length,results,errors},null,2));console.log(`${results.length} touch checks passed using native Chrome touch and wheel input.`);
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});