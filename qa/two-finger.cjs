// Real Chrome touch input against the exact Android and public bundles.
const {chromium}=require('./runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[];
 const check=(ok,name)=>{assert.ok(ok,name);results.push(name);};
 try{
  for(const [name,folder] of [['APK',path.join(root,'.android-build/assets/app')],['Pages',path.resolve(root,'../GitHub-Pages')]]){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url()),file=path.resolve(folder,url.pathname.slice(1)||'index.html');
    assert.ok(file.startsWith(folder+path.sep));
    await route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'text/plain'});
   });
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.goto('https://appassets.androidplatform.net/index.html',{waitUntil:'networkidle'});await page.waitForSelector('.district');
   const cdp=await context.newCDPSession(page),point=(x,y,id)=>({x,y,id,radiusX:8,radiusY:8,force:1});
   const send=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
   const transform=()=>page.locator('#geography').getAttribute('transform');
   const matrix=()=>page.locator('#geography').evaluate(el=>{const m=el.transform.baseVal.consolidate().matrix;return {k:m.a,x:m.e,y:m.f};});
   const center=async()=>{await page.locator('#map').scrollIntoViewIfNeeded();const r=await page.locator('#map').boundingBox();return {x:r.x+r.width*.6,y:r.y+r.height*.5};};
   async function pair(x,y,dx,dy,spread=40){
    await send('touchStart',[point(x-40,y,0),point(x+40,y,1)]);
    for(let i=1;i<=8;i++)await send('touchMove',[point(x-40+dx*i/8-(spread-40)*i/8,y+dy*i/8,0),point(x+40+dx*i/8+(spread-40)*i/8,y+dy*i/8,1)]);
    await send('touchEnd',[]);await page.waitForTimeout(100);
   }
   for(const [width,height] of [[390,844],[844,390],[800,1280],[1280,800]]){
    await page.setViewportSize({width,height});
    // A tablet overview can fit entirely on screen. Give its document room
    // below the real content so native page scrolling can still be measured.
    await page.evaluate(()=>{let room=document.querySelector('#touch-test-room');if(!room){room=document.createElement('div');room.id='touch-test-room';document.body.append(room);}room.style.height=innerHeight+'px';});
    for(const layer of ['districts','gi','communities','places','nature','history']){
     const label=`${name} ${width}x${height} ${layer}`;
     await page.locator(`[data-layer=${layer}]`).click();await page.locator('#zoom-reset').click();
     let {x,y}=await center();const before=await transform(),scroll=await page.evaluate(()=>scrollY),detail=await page.locator('#detail h2').textContent();
     await send('touchStart',[point(x,y+55,0)]);
     for(let i=1;i<=8;i++){await send('touchMove',[point(x,y+55-110*i/8,0)]);await page.waitForTimeout(18);}
     await send('touchEnd',[]);await page.waitForTimeout(250);
     check(await page.evaluate(()=>scrollY)>scroll+30,label+': one finger scrolls past the map');
     check(await transform()===before,label+': one finger leaves map unchanged');
     check(await page.locator('#detail h2').textContent()===detail,label+': scrolling does not select a district');
     ({x,y}=await center());const pairScroll=await page.evaluate(()=>scrollY);
     await pair(x,y,0,0,80);let t=await matrix();check(t.k>1.8&&t.k<2.2,label+': two-finger pinch zoom');
     const p=t;await pair(x,y,25,20);t=await matrix();check(Math.abs(t.k-p.k)<.01&&t.x>p.x+10&&t.y>p.y+10,label+': two-finger pan');
     check(await page.evaluate(()=>scrollY)===pairScroll,label+': two fingers do not scroll the page');
     check(await page.evaluate(()=>Math.abs(visualViewport.scale-1)<.01),label+': page pinch disabled on map');
     await send('touchStart',[point(x-30,y,0),point(x+30,y,1)]);
     await send('touchMove',[point(x-45,y,0),point(x+45,y,1)]);
     await send('touchEnd',[point(x-45,y,0)]);const partial=await transform();
     await send('touchMove',[point(x-15,y-25,0)]);check(await transform()===partial,label+': lifting one finger stops map drag');
     await send('touchEnd',[]);
     await send('touchStart',[point(x-40,y,0),point(x+40,y,1)]);await send('touchCancel',[]);
     const cancelled=(await matrix()).k;await pair(x,y,0,0,50);check((await matrix()).k>cancelled,label+': cancellation recovers');
    }
   }
   await page.setViewportSize({width:390,height:844});await page.locator('[data-layer=districts]').click();await page.locator('#zoom-reset').click();
   await page.locator('.district[aria-label^="Dhaka district,"]').tap();check(await page.locator('#detail h2').textContent()==='Dhaka',name+': single tap still selects district');
   await page.locator('#zoom-in').click();check((await matrix()).k>1,name+': zoom buttons still work');
   await page.locator('#zoom-reset').click();const {x,y}=await center();await page.mouse.move(x,y);await page.mouse.wheel(24,35);check((await matrix()).k===1&&Math.abs((await matrix()).x)>5,name+': trackpad pan retained');
   await context.close();
  }
  check(errors.length===0,'No touch or passive-listener errors');
  fs.writeFileSync(path.join(root,'.android-build/two-finger-results.json'),JSON.stringify({checks:results.length,results,errors},null,2));
  console.log(results.length+' checks passed for single-finger page scroll and two-finger map gestures.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
