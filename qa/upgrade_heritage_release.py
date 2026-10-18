"""Apply the accompanying release and layout updates with checked anchors."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def replace(file,before,after):
    path=ROOT/file;text=path.read_text(encoding='utf-8');assert before in text,(file,before)
    path.write_text(text.replace(before,after),encoding='utf-8')
replace('index.html','<div class="map-area" id="map-area">','<label id="place-type-control" class="place-type-control" hidden><span>Place type</span><select id="place-type"><option value="all">All places</option><option value="mosques">Historic mosques</option><option value="parks">Udyans &amp; gardens</option><option value="heritage">Other heritage</option><option value="infrastructure">Infrastructure</option></select></label>\n          <div class="map-area" id="map-area">')
replace('assets/app.js',"state.division='';state.record=null;state.district=null;$('#map-search')","state.division='';state.record=null;state.district=null;$('#place-type').value='all';$('#map-search')")
replace('assets/app.js','Explore archaeological sites, memorials and transport connections. Select a marker to link a place with its story.','Explore historic mosques, udyans, gardens, palaces, temples and transport connections. Choose a place type or search its name, then select a marker or directory entry.')
replace('assets/app.js',"record.kind.toUpperCase()","(record.category??record.kind).toUpperCase()")
replace('assets/app.js',"p.kind==='Heritage'?'#d56750':'#bc7e32'","p.kind==='Heritage'?'#d56750':'#bc7e32'")
replace('assets/app.js',">Landscape</span><span><i style=\"background:#d56750\"></i>Heritage",">Landscape / garden</span><span><i style=\"background:#d56750\"></i>Heritage")
replace('assets/style.css','.district:hover,.district:focus{fill:#aecbb5!important;stroke:var(--green);stroke-width:2.1}', '.district{outline:none}.district:hover{stroke:var(--green);stroke-width:2.1}.district:focus-visible{stroke:#083d34;stroke-width:3.5}')
replace('assets/style.css','.district.selected{fill:#155e50!important;stroke:#083d34;stroke-width:2.4}', '.district.selected{stroke:#083d34;stroke-width:3}')
with (ROOT/'assets/glass.css').open('a',encoding='utf-8') as f:f.write('''
/* Use the district's shape for focus and selection, never its bounding box. */
#map .district:focus { outline: none; stroke: #083d34; stroke-width: 3.5; }
.district:focus-visible { stroke: #083d34; stroke-width: 3.5; }
.place-type-control { display: flex; align-items: center; gap: 10px; padding: 0 16px 8px; font-size: 12px; color: var(--muted); }
.place-type-control[hidden] { display: none; }
.place-type-control select { flex: 1; min-width: 0; min-height: 44px; font-size: 14px; }
''')
replace('android/AndroidManifest.xml','android:versionCode="2" android:versionName="1.1"','android:versionCode="3" android:versionName="1.2"')
replace('android/package_assets.cjs','1.2.1','1.3.0')
replace('android/prepare_site.py','22 places','42 places')
replace('android/prepare_site.py','v1.2.1','v1.3.0')
replace('android/verify_web.cjs',"['places',12]","['places',32]")
replace('qa/browser.cjs',"count()===12,'12 heritage and infrastructure anchors'","count()===32,'32 historic and infrastructure places'")
replace('qa/validate.mjs',"places.length===22,'22 places'","places.length===42,'42 places'")
replace('qa/validate.mjs','20 communities · 22 places','20 communities · 42 places')
replace('qa/verify_delivery.cjs','v1.2.1','v1.3.0')
replace('qa/verify-pages-update.cjs','1.2.1','1.3.0')
replace('qa/verify-live-pages.cjs','1.2.1','1.3.0')
replace('qa/verify-final-delivery.py',"'apkVersion':'1.1'","'apkVersion':'1.2'")
print('Heritage release layout, version and count anchors updated.')
