const {chromium}=require('./runtime.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 process.env.PORT='0';const server=require('./serve.cjs');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;let browser;const profile=fs.mkdtempSync(path.join(__dirname,'chrome-profile-'));
 const results=[],errors=[];const check=(value,name)=>{assert.ok(value,name);results.push(name);};
 try{
  const {FACTS,TIMELINE,QUIZ}=await import('../assets/content.js');
  const context=await chromium.launchPersistentContext(profile,{channel:'chrome',headless:true,viewport:{width:1440,height:1000}});browser=context;const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(base+'/bangladesh-affairs/',{waitUntil:'networkidle'});await page.waitForSelector('.district');
  check(await page.locator('.district').count()===64,'64 district paths rendered');
  const paths=page.locator('.district');
  for(let i=0;i<64;i++){const name=(await paths.nth(i).getAttribute('aria-label')).split(' district,')[0];await paths.nth(i).press('Enter');check((await page.locator('#detail h2').textContent())===name,'Select '+name);}
  check((await page.locator('#explored-count').textContent()).includes('64 / 64'),'All explored progress');
  await page.locator('#clear').click();await page.locator('#map-search').fill('ঢাকা');check(await page.locator('.directory-item').count()===1,'Bangla district search');
  await page.locator('#clear').click();await page.locator('#division').selectOption('Sylhet');check(await page.locator('.directory-item').count()===4,'Division filter');
  await page.locator('#clear').click();await page.locator('[data-layer=gi]').click();check(await page.locator('.directory-item').count()===64,'64 GI directory entries');
  await page.locator('[data-record=gi-1]').click();check((await page.locator('#detail').textContent()).includes('Jamdani saree'),'GI product selection');
  await page.locator('#map-search').fill('ভোলা');check(await page.locator('.directory-item').count()===1,'Bangla GI search');
  await page.locator('#clear').click();await page.locator('[data-layer=communities]').click();check(await page.locator('.directory-item').count()===20,'20 communities');
  await page.locator('[data-record=community-11]').click();check((await page.locator('#detail').textContent()).includes('Matrilineal'),'Garo profile');
  await page.locator('#clear').click();await page.locator('[data-layer=places]').click();check(await page.locator('.directory-item').count()===12,'12 heritage and infrastructure anchors');
  await page.locator('[data-layer=nature]').click();check(await page.locator('.directory-item').count()===10,'10 landscape anchors');check(await page.locator('#rivers-toggle').isChecked(),'Nature rivers enabled');check(await page.locator('.river').count()===9,'River geometry bundled');
  await page.locator('[data-layer=history]').click();const slider=page.locator('#timeline-slider');await slider.focus();await slider.press('Home');
  for(let i=0;i<TIMELINE.length;i++){check(await page.locator('#timeline-date').textContent()===TIMELINE[i].date,'History stop '+i);check(await page.locator('.history-active').count()===TIMELINE[i].districts.length,'Historic location highlights '+i);if(i<TIMELINE.length-1)await slider.press('ArrowRight');}
  check(await page.locator('#timeline-next').isDisabled(),'Timeline upper boundary');await page.locator('#timeline-play').click();check((await page.locator('#timeline-play').getAttribute('aria-label'))==='Pause history timeline','History playback starts');await page.locator('#timeline-play').click();check((await page.locator('#timeline-play').getAttribute('aria-label'))==='Play history timeline','History playback stops');
  await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'91 facts rendered');await page.locator('[data-save=fact-1]').click();await page.locator('#saved-only').click();check(await page.locator('.fact-card').count()===1,'Saved-only filter');
  await page.reload({waitUntil:'networkidle'});await page.locator('[data-tab=facts]').click();check((await page.locator('#saved-count').textContent())==='1','Saved facts persist');
  for(const topic of ['national','agriculture','population','economy','industry','constitution','politics','government','heritage','location','physical','environment','climate','disasters']){await page.locator(`[data-topic=${topic}]`).click();check(await page.locator('.fact-card').count()>=6,'Facts topic '+topic);}
  await page.locator('[data-topic=all]').click();await page.locator('#facts-search').fill('পাট');check(await page.locator('.fact-card').count()>0,'Bangla facts search');await page.locator('#facts-search').fill('no-such-fact-123');check(await page.locator('#facts-empty').isVisible(),'Facts empty state');await page.locator('#facts-search').fill('');
  await page.locator('#practice').click();
  for(let i=0;i<QUIZ.length;i++){await page.locator(`[data-answer="${QUIZ[i][2]}"]`).click();check(await page.locator('.correct').count()===1,'Practice feedback '+i);await page.locator('#quiz-next').click();}
  check((await page.locator('.quiz-finish').textContent()).includes('12 / 12'),'Practice complete');await page.locator('#quiz-dialog [data-close]').click();
  await page.locator('[data-tab=syllabus]').click();check(await page.locator('.syllabus-card').count()===14,'Both image syllabi present');await page.locator('[data-topic-open=climate]').click();check(await page.locator('#facts-heading').textContent()==='Weather & climate change','Syllabus links to study cards');
  const screenshots=path.join(__dirname,'screenshots');fs.mkdirSync(screenshots,{recursive:true});
  await page.locator('#about').click();await page.locator('#clear-progress').click();check(await page.locator('#saved-count').textContent()==='0','Clear saved cards');check((await page.locator('#explored-count').textContent()).includes('0 / 64'),'Clear explored progress');await page.locator('#sources-dialog [data-close]').click();
  await page.screenshot({path:path.join(screenshots,'facts-desktop.png'),fullPage:true});
  await page.locator('[data-tab=map]').click();await page.locator('#clear').click();await page.locator('[data-layer=districts]').click();await page.screenshot({path:path.join(screenshots,'desktop.png'),fullPage:true});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:844});
   for(const tab of ['map','facts','syllabus']){await page.locator(`[data-tab=${tab}]`).click();const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);if(!fits){await page.screenshot({path:path.join(screenshots,`overflow-${tab}-${width}.png`),fullPage:true});console.log(await page.evaluate(()=>[...document.querySelectorAll('main *')].map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).filter(e=>e.width>innerWidth).slice(0,8)));}check(fits,`${tab}: no overflow at ${width}px`);}
   await page.locator('#about').click();check(await page.locator('#sources-dialog').isVisible(),`Sources modal ${width}px`);check(await page.evaluate(()=>document.querySelector('#sources-dialog').getBoundingClientRect().width<=innerWidth),`Modal fits ${width}px`);await page.locator('#sources-dialog [data-close]').click();
  }
  await page.setViewportSize({width:390,height:844});await page.locator('[data-tab=map]').click();await page.screenshot({path:path.join(screenshots,'mobile.png'),fullPage:true});
  await page.locator('#map-search').fill('Dhaka');await page.locator('#directory [data-district=Dhaka]').click();check(await page.locator('#detail h2').textContent()==='Dhaka','Phone district detail');await page.locator('[data-focus-district=Dhaka]').click();check(await page.locator('#map-area').isVisible(),'Phone focus returns to map');await page.locator('#clear').click();
  await page.locator('[data-layer=history]').click();await slider.focus();await slider.press('Home');await slider.press('ArrowRight');await page.screenshot({path:path.join(screenshots,'history-mobile.png'),fullPage:true});
  await page.locator('#zoom-in').click();await page.locator('#zoom-in').click();await page.locator('#labels').check();const labelSizes=await page.locator('.district-label').evaluateAll(xs=>xs.filter(x=>getComputedStyle(x).display!=='none').map(x=>x.getBoundingClientRect().height));check(labelSizes.length>0&&Math.max(...labelSizes)<22,'Mobile zoom labels remain readable, not inflated');
  check(await page.locator('#install').isVisible(),'Installation control available');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>navigator.serviceWorker.controller);
  const cdp=await context.newCDPSession(page);const appManifest=await cdp.send('Page.getAppManifest');check(appManifest.errors.length===0,'Chrome parses the install manifest');const installability=await cdp.send('Page.getInstallabilityErrors');check(installability.installabilityErrors.length===0,'Chrome installability diagnostics clear');
  const cached=await page.evaluate(async()=>{const keys=await caches.keys();const key=keys.find(k=>k.includes('bangladesh-affairs/'));return (await (await caches.open(key)).keys()).map(r=>r.url);});check(cached.length===21,'All 21 offline assets cached');
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await page.waitForSelector('.district');check(await page.locator('.district').count()===64,'Offline reload: map geometry');
  await page.locator('[data-layer=history]').click();await page.locator('#timeline-slider').press('End');check((await page.locator('#detail h2').textContent()).includes('GI'),'Offline history');await page.locator('[data-tab=facts]').click();check(await page.locator('.fact-card').count()===91,'Offline facts');await page.locator('[data-tab=syllabus]').click();await page.locator('.source-images summary').click();check(await page.locator('.source-images img').evaluateAll(xs=>xs.every(x=>x.complete&&x.naturalWidth>0)),'Offline original images');await context.setOffline(false);
  const rootPage=await context.newPage();await rootPage.goto(base+'/',{waitUntil:'networkidle'});await rootPage.waitForSelector('.district');await rootPage.evaluate(async()=>navigator.serviceWorker.ready);await rootPage.waitForFunction(()=>navigator.serviceWorker.controller);check(await rootPage.locator('.district').count()===64,'Root deployment supported');
  const scopes=await page.evaluate(async()=>{return (await navigator.serviceWorker.getRegistrations()).map(r=>r.scope);});check(scopes.length===2,'Independent root and project PWA scopes');
  check(errors.length===0,'No runtime or asset errors');
  fs.writeFileSync(path.join(__dirname,'browser-results.json'),JSON.stringify({checks:results.length,results,errors,offlineAssets:cached.length},null,2));console.log(`${results.length} browser checks passed; offline reload and 320/390/768/1440px layouts verified.`);
 }finally{if(browser)await browser.close();server.close();const absolute=path.resolve(profile),qaRoot=path.resolve(__dirname)+path.sep;if(!absolute.startsWith(qaRoot)||!path.basename(absolute).startsWith('chrome-profile-'))throw new Error('Unsafe QA profile cleanup path');fs.rmSync(absolute,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});