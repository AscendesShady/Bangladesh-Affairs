// Generate an offline-only asset set from the existing educational app.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),web=process.argv.includes('--web');
const out=web?path.resolve(root,path.basename(root)==='Reproduce'?'../GitHub-Pages':'GitHub-Pages'):path.join(root,'.android-build','assets','app');
fs.mkdirSync(out,{recursive:true});
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const replace=(source,pattern,value,label)=>{assert.ok(pattern.test(source),'Missing packaging anchor: '+label);return source.replace(pattern,value);};
let app=read('assets/app.js');
app=replace(app,/^import[^\n]+;\n/,'','module import');
if(!web)app=replace(app,/function updateConnection\(\)\{[\s\S]*?(?=initFacts\(\);)/,"document.getElementById('offline-status').textContent='All content is included on this device';\n",'web installer');
app=replace(app,/  const names=\['districts'[\s\S]*?  data=Object\.fromEntries\([^\n]+\);/,'  data=PACKAGED_DATA;','network data loading');
if(!web)app=app.replace(/,installPrompt;/,';').replace(/ target="_blank"/g,'');
app=app.replace('phone.addEventListener(\'change\',placeNavigation);','if(phone.addEventListener)phone.addEventListener(\'change\',placeNavigation);else phone.addListener(placeNavigation);');
app=app.replace("new ResizeObserver(()=>requestAnimationFrame(syncGlassNavigation)).observe($('.tabs'));","if(window.ResizeObserver)new ResizeObserver(()=>requestAnimationFrame(syncGlassNavigation)).observe($('.tabs'));else window.addEventListener('resize',syncGlassNavigation);");
app=app.replace("new ResizeObserver(syncSymbols).observe($('#map'));","if(window.ResizeObserver)new ResizeObserver(()=>requestAnimationFrame(syncSymbols)).observe($('#map'));else window.addEventListener('resize',syncSymbols);");
app=replace(app,/  const reducedMotion=matchMedia\('[\s\S]*?  \},\{passive:true\}\);\n/,'','mouse-only light tracking');
if(!web)app=app.replace('This app works offline; external reference links do not.','All study content is included in this app. External references open in your browser.');
app=app.replace('stored only in this browser','stored only on this device').replace('Your browser could not save progress','This app could not save progress');
app=replace(app,/  \$\('#fact-total'\)\.textContent=FACTS\.length;\n/,'','duplicated hero fact counter');
app=replace(app,/ui=svg\.getBoundingClientRect\(\)\.width\/vb\.width\|\|1;/,'ui=Math.abs(svg.getScreenCTM()?.a)||svg.getBoundingClientRect().width/vb.width||1;','screen-sized map labels');
app=app.replace('w=d.name.length*5.4+10','w=d.name.length*(narrow?6.2:7.2)+10');
app=app.replace(".style('font-size','11px')",".style('font-size',`${narrow?12:14}px`)");
app=app.replace("`${ui<.6?10:12}px`","`${narrow?12:14}px`");
const shortTitles={'Bangladesh, district by district':'Bangladesh districts','Products with a sense of place':'GI products','A mosaic of communities':'Communities','Places worth remembering':'Important places','The geography of everyday life':'Nature & hazards','Follow the story through time':'History timeline'};
for(const [before,after] of Object.entries(shortTitles))app=app.split(before).join(after);
app=app.replace(/Reconnect and use Reload app to retry\./g,'Use Reload app to retry.').replace(/Reconnect and use Reload app below to refresh its files\./g,'Use Reload app below to try again.');
const data={};
for(const name of ['districts','district-info','gi','communities','places','metadata','rivers'])data[name.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=JSON.parse(read(`assets/data/${name}.${['districts','rivers'].includes(name)?'geojson':'json'}`));
let html=read('index.html');
html=replace(html,/<div class="intro">[\s\S]*?(?=\s*<div class="atlas-toolbar">)/,'','map promotional hero');
html=replace(html,/<div class="intro">[\s\S]*?(?=<div class="facts-tools">)/,'','facts promotional hero');
html=replace(html,/<div class="intro">[\s\S]*?(?=<div class="syllabus-banner">)/,'','syllabus promotional hero');
html=html.replace('Bangladesh, district by district','Bangladesh districts');
const options=html.match(/<div class="map-options">[\s\S]*?<\/div>/)[0];
const reset=html.match(/<button id="clear"[\s\S]*?<\/button>/)[0];
html=html.replace(options,'').replace(reset,'');
html=html.replace('<div id="map-legend"',options.replace(/<\/div>$/,reset+'</div>')+'<div id="map-legend"');
if(!web){
html=html.replace(/  <link rel="(?:manifest|icon|apple-touch-icon)"[^\n]*\n/g,'').replace(/  <meta name="apple-mobile-web-app-capable"[^\n]*\n/g,'');
html=replace(html,/<button id="install"[\s\S]*?<\/button>/,'','install button');
html=replace(html,/<span id="connection"[^>]*>[\s\S]*?<\/span>/,'','connection indicator');
html=replace(html,/  <dialog id="install-dialog">[\s\S]*?<\/dialog>\n/,'','installation dialog');
}
html=html.replace(/    <noscript>[\s\S]*?<\/noscript>\n/,'');
if(!web)html=replace(html,/  <script>\n[\s\S]*?  <\/script>\n/,`  <script>
    (()=>{
      const alert=document.getElementById('app-recovery');
      const show=()=>{document.getElementById('recovery-message').textContent='The atlas could not load. Tap Reload app to try again.';alert.hidden=false;};
      const timer=setTimeout(show,15000);
      window.addEventListener('atlas-ready',()=>{clearTimeout(timer);alert.hidden=true;});
      window.addEventListener('atlas-error',()=>{clearTimeout(timer);show();});
      window.addEventListener('error',event=>{if(event.error||event.target instanceof HTMLScriptElement){clearTimeout(timer);show();}},true);
      for(const id of ['reload-app','recovery-retry'])document.getElementById(id).addEventListener('click',()=>location.reload());
    })();
  </script>\n`,'service-worker bootstrap');
html=replace(html,/  <script src="\.\/assets\/vendor\/d3\.min\.js"><\/script>\n  <script type="module" src="\.\/assets\/app\.js"><\/script>/,'  <script src="./assets/offline.js" defer></script>','script bundle');
if(!web)html=html.replace('Preparing offline access…','All content is included on this device');
html=html.replace('The atlas could not load. Reconnect, then reload the app.','The atlas could not load. Tap Reload app to try again.');
const compatibility=`if(!String.prototype.replaceAll)String.prototype.replaceAll=function(a,b){return this.split(a).join(b);};\n`;
const js="import {geoArea,geoMercator,geoPath,select,selectAll,zoom as createZoom,zoomIdentity} from 'd3';\nconst d3={geoArea,geoMercator,geoPath,select,selectAll,zoom:createZoom,zoomIdentity};\n"+compatibility+'const PACKAGED_DATA='+JSON.stringify(data)+';\n'+read('assets/content.js').replace(/^export /gm,'')+'\n'+app;
const esbuild=require(path.join(root,'.android-build/js-tools/node_modules/esbuild'));
const result=esbuild.buildSync({stdin:{contents:js,resolveDir:path.join(root,'.android-build/js-tools'),sourcefile:'offline-entry.js'},bundle:true,write:false,format:'iife',target:'chrome64',minify:true,charset:'utf8',legalComments:'none',metafile:true});
const code=result.outputFiles[0].text;
fs.mkdirSync(path.join(out,'assets'),{recursive:true});fs.writeFileSync(path.join(out,'assets/offline.js'),code);fs.writeFileSync(path.join(out,'index.html'),html);
for(const file of ['assets/style.css','assets/glass.css','assets/fonts/bangla.woff2','assets/fonts/OFL.txt','assets/icons/icon-192.png','assets/vendor/d3-LICENSE.txt','sources/bangladesh-affairs-syllabus.png','sources/geography-environment-syllabus.png']){
 const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);
}
for(const file of ['assets/style.css','assets/glass.css'])fs.writeFileSync(path.join(out,file),read(file).replace(/dvh/g,'vh')+(file.endsWith('glass.css')?'\n'+read('android/responsive.css'):''));
fs.copyFileSync(path.join(root,'LICENSE'),path.join(out,'LICENSE'));
const packages=new Set();for(const [input,details] of Object.entries(Object.values(result.metafile.outputs)[0].inputs)){if(details.bytesInOutput>0){const match=input.replace(/\\/g,'/').match(/node_modules\/(d3[^/]*)\//);if(match)packages.add(match[1]);}}
const credits=[read('assets/vendor/d3-LICENSE.txt')];for(const name of [...packages].sort()){const license=path.join(root,'.android-build/js-tools/node_modules',name,'LICENSE');if(fs.existsSync(license))credits.push(name+'\n'+fs.readFileSync(license,'utf8'));}
fs.writeFileSync(path.join(out,'assets/vendor/d3-LICENSE.txt'),credits.join('\n\n'));
assert.ok(!/\bfetch\(/.test(code),'No network data loader in the runtime');
if(!web){assert.ok(!/serviceWorker|beforeinstallprompt|appinstalled/.test(code),'No PWA code in Android runtime');assert.ok(!/type="module"|manifest.webmanifest|id="install"/.test(html),'No web installation or module-loading dependency');}
if(web){
 html=html.replace('data-release="1.1.1"','data-release="1.2.1"').replace(/[ \t]+$/gm,'');fs.writeFileSync(path.join(out,'index.html'),html);
 for(const file of ['manifest.webmanifest','assets/icons/icon-512.png']){const dest=path.join(out,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,file),dest);}
 const core=['./','./index.html','./assets/offline.js','./assets/style.css','./assets/glass.css','./assets/fonts/bangla.woff2','./assets/fonts/OFL.txt','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./assets/vendor/d3-LICENSE.txt','./manifest.webmanifest','./sources/bangladesh-affairs-syllabus.png','./sources/geography-environment-syllabus.png'];
 const worker=read('sw.js').replace("const VERSION='v1.1.1';","const VERSION='v1.2.1';").replace(/const CORE=\[[\s\S]*?\];/,'const CORE='+JSON.stringify(core)+';');fs.writeFileSync(path.join(out,'sw.js'),worker);fs.writeFileSync(path.join(out,'.nojekyll'),'');
}
const summary={districts:data.districtInfo.length,gi:data.gi.length,communities:data.communities.length,places:data.places.length,javascriptBytes:Buffer.byteLength(code),webFiles:11};
fs.writeFileSync(path.join(root,'.android-build/assets-results.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));
