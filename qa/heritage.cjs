const {chromium}=require('./runtime.cjs');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),places=JSON.parse(fs.readFileSync(path.join(root,'assets/data/places.json')));
(async()=>{
 const d3=await import(pathToFileURL(path.join(root,'.android-build/js-tools/node_modules/d3/src/index.js')));
 const geo=JSON.parse(fs.readFileSync(path.join(root,'assets/data/districts.geojson'))),results=[],errors=[];
 const check=(ok,name)=>{assert.ok(ok,name);results.push(name);};
 for(const feature of geo.features)if(d3.geoArea(feature)>2*Math.PI){const polys=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polys)for(const ring of polygon)ring.reverse();}
 check(places.length===42&&new Set(places.map(p=>p.id)).size===42,'42 uniquely identified places');
 for(const record of places.filter(p=>Number(p.id.slice(6))>=22)){
  check(record.source.startsWith('https://')&&record.bn&&record.note.length>50,record.name+': source and study note');
  const district=geo.features.find(f=>record.districts.includes(f.properties.name));
  check(d3.geoContains(district,record.coords),record.name+': coordinate lies in associated district');
 }
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const [target,folder] of [['APK',path.join(root,'.android-build/assets/app')],['Pages',path.resolve(root,'../GitHub-Pages')]]){
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,serviceWorkers:'block'});
   await context.route('**/*',async route=>{const name=new URL(route.request().url()).pathname.slice(1)||'index.html',file=path.resolve(folder,name);assert.ok(file.startsWith(folder+path.sep));const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)]||'text/plain';await route.fulfill({body:fs.readFileSync(file),contentType:type});});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto('https://appassets.androidplatform.net/index.html',{waitUntil:'networkidle'});await page.waitForSelector('.district');
   for(const [width,height] of [[390,844],[1280,800]]){
    await page.setViewportSize({width,height});await page.locator('[data-layer=districts]').click();await page.locator('#clear').click();
    const dhaka=page.locator('.district[aria-label^="Dhaka district,"]');
    const original=await dhaka.evaluate(e=>getComputedStyle(e).fill);await dhaka.focus();await dhaka.press('Enter');
    const visual=await dhaka.evaluate(e=>{const s=getComputedStyle(e);return {outline:s.outlineStyle,stroke:s.stroke,width:parseFloat(s.strokeWidth),fill:s.fill,focus:document.activeElement===e};});
    check(visual.outline==='none'&&visual.width>=3&&visual.focus,`${target} ${width}: keyboard focus follows district border without a box ${JSON.stringify(visual)}`);
    check(visual.fill===original,`${target} ${width}: selection preserves district fill`);
    await page.locator('#map').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`.android-build/heritage-${target}-${width}-border.png`)});
    await page.locator('[data-layer=places]').click();await page.locator('#clear').click();
    check(await page.locator('.directory-item').count()===32,`${target} ${width}: all 32 historic and important places`);
    for(const [type,count] of [['mosques',9],['parks',5],['heritage',15],['infrastructure',3]]){
     await page.locator('#place-type').selectOption(type);
     check(await page.locator('.directory-item').count()===count&&await page.locator('.marker').count()===count,`${target} ${width}: ${type} filter updates map and directory`);
    }
    await page.locator('#clear').click();
    for(const record of places.filter(p=>p.category)){
     await page.locator(`#directory [data-record="${record.id}"]`).click();
     check(await page.locator('#detail h2').textContent()===record.name,`${target} ${width}: opens ${record.name}`);
     check(await page.locator('#detail .source-link a').getAttribute('href')===record.source,`${target} ${width}: source link for ${record.name}`);
    }
    await page.locator('#clear').click();await page.locator('#map-search').fill('মসজিদ');check(await page.locator('.directory-item').count()===9,`${target} ${width}: Bengali mosque search`);
    await page.locator('#clear').click();await page.locator('#map-search').fill('uddyan');check(await page.locator('.directory-item').count()===5,`${target} ${width}: uddyans alias search`);
    await page.locator('#clear').click();await page.locator('#division').selectOption('Rajshahi');await page.locator('#place-type').selectOption('mosques');check(await page.locator('.directory-item').count()===4,`${target} ${width}: category combines with division filter`);
    await page.locator('#clear').click();await page.locator('#place-type').selectOption('parks');await page.locator('#map').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`.android-build/heritage-${target}-${width}-parks.png`)});
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${target} ${width}: filter fits screen`);
    await page.locator('[data-layer=nature]').click();check(!await page.locator('#place-type-control').isVisible()&&await page.locator('.directory-item').count()===10,`${target} ${width}: nature layer retained`);
   }
   await context.close();
  }
  check(errors.length===0,'No heritage runtime errors');fs.writeFileSync(path.join(root,'.android-build/heritage-results.json'),JSON.stringify({checks:results.length,results,errors},null,2));console.log(results.length+' heritage, spatial, source-link and border-focus checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
