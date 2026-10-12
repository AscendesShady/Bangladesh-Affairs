import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {FACTS,TOPICS,TIMELINE,QUIZ,SOURCES} from '../assets/content.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>JSON.parse(readFileSync(root+'assets/data/'+name,'utf8'));
const districts=read('district-info.json'),geo=read('districts.geojson'),gi=read('gi.json'),communities=read('communities.json'),places=read('places.json'),rivers=read('rivers.geojson');
let checks=0;const check=(value,message)=>{assert.ok(value,message);checks++;};
check(districts.length===64,'64 districts');check(geo.features.length===64,'64 polygons');
const names=new Set(districts.map(d=>d.name));check(names.size===64,'District names unique');
const divisionCounts={Dhaka:13,Chattogram:11,Rajshahi:8,Khulna:10,Barishal:6,Sylhet:4,Rangpur:8,Mymensingh:4};
for(const [division,count] of Object.entries(divisionCounts))check(districts.filter(d=>d.division===division).length===count,division+' membership');
for(const f of geo.features){check(names.has(f.properties.name),'Geometry join: '+f.properties.name);check(['Polygon','MultiPolygon'].includes(f.geometry.type),'Polygon geometry');}
for(const d of districts)check(d.bn&&d.note&&d.rivers.length&&d.landmarks.length&&d.source,'Complete district profile: '+d.name);
check(gi.length===64,'64 GI products');check(new Set(gi.map(g=>g.number)).size===64,'Unique registrations');
for(const g of gi){check(g.number>=1&&g.number<=64&&g.bn&&g.applicationDate&&g.source,'GI provenance');for(const n of g.districts)check(names.has(n),'GI association: '+n);}
check(communities.length===20,'20 community profiles');check(places.length===22,'22 places');
for(const r of [...communities,...places,...FACTS,...TIMELINE]){for(const n of r.districts)check(names.has(n),'Association: '+n);check(r.source in SOURCES||/^https:\/\//.test(r.source),'Reference source');}
for(const p of places)check(p.coords[0]>=88&&p.coords[0]<=93&&p.coords[1]>=20&&p.coords[1]<=27,'Bangladesh coordinates');
check(TOPICS.length===14,'14 syllabus topics');check(TOPICS.filter(t=>t.group==='Bangladesh affairs').length===9,'9 affairs topics');
for(const t of TOPICS)check(FACTS.filter(f=>f.topic===t.id).length>=6,'Substantive coverage: '+t.id);
check(FACTS.length===91,'91 study cards');check(new Set(FACTS.map(f=>f.id)).size===FACTS.length,'Unique fact IDs');
check(TIMELINE.length===24,'24 timeline stops');check(TIMELINE.every((e,i)=>!i||e.year>=TIMELINE[i-1].year),'Chronological timeline');
check(QUIZ.length===12&&QUIZ.every(q=>q[1].length===4&&q[2]>=0&&q[2]<4),'12 valid practice questions');check(rivers.features.length>0,'River data');
const sw=readFileSync(root+'sw.js','utf8');const match=sw.match(/const CORE=(\[[\s\S]*?\]);/);const core=JSON.parse(match[1].replaceAll("'",'"'));
for(const file of core)check(file==='./'||existsSync(root+file.slice(2)), 'Offline asset: '+file);
const manifest=JSON.parse(readFileSync(root+'manifest.webmanifest','utf8'));check(manifest.scope==='./'&&manifest.start_url.startsWith('./'),'Project-relative PWA paths');check(manifest.display==='standalone','Standalone display');
for(const icon of manifest.icons)check(existsSync(root+icon.src.slice(2)),'Icon exists');
check(!/https:\/\/.*(?:src=|import)/.test(readFileSync(root+'index.html','utf8')),'No remote runtime assets');
console.log(`${checks} static checks passed. 64 districts · 64 GI · 20 communities · 22 places · 91 facts · 24 events.`);
