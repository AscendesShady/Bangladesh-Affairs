import {TOPICS,FACTS,TIMELINE,SOURCES,QUIZ} from './content.js';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storage={get(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return Array.isArray(fallback)&&!Array.isArray(value)?fallback:value??fallback;}catch{return fallback;}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('Your browser could not save progress. You can still explore.');}}};
const state={tab:'map',layer:'districts',district:null,record:null,division:'',search:'',topic:'all',factSearch:'',savedOnly:false,history:9,transform:d3.zoomIdentity,saved:new Set(storage.get('ba-saved',[])),explored:new Set(storage.get('ba-explored',[]))};
const divisions=['Dhaka','Chattogram','Rajshahi','Khulna','Barishal','Sylhet','Rangpur','Mymensingh'];
const colors={Dhaka:'#c0d7b0',Chattogram:'#b6cfaa',Rajshahi:'#ddcf9e',Khulna:'#afcdbc',Barishal:'#c5d9cd',Sylhet:'#a8c8b1',Rangpur:'#ced6a9',Mymensingh:'#d7debd'};
const layerInfo={districts:['THE DISTRICT ATLAS','Bangladesh, district by district','District directory','64 districts'],gi:['ORIGIN & CRAFT','Products with a sense of place','GI product directory','64 registered products'],communities:['PEOPLE & CULTURE','A mosaic of communities','Community directory','20 community profiles'],places:['HERITAGE & CONNECTIONS','Places worth remembering','Place directory','12 heritage & infrastructure places'],nature:['LANDSCAPES & RESILIENCE','The geography of everyday life','Landscape directory','10 landscape anchors'],history:['THE HISTORY ATLAS','Follow the story through time','History stops','24 historical stops']};
let data,geo,projection,path,zoom,featureByName,metricsByName,districtByName,playTimer,toastTimer,installPrompt;

function sourceInfo(source){if(SOURCES[source])return SOURCES[source];const url=new URL(source);return {name:url.hostname==='en.banglapedia.org'?'Banglapedia · '+(url.searchParams.get('title')??'reference').replaceAll('_',' '):url.hostname.replace('www.','')+' · reference',url:source};}
function sourceLink(source,label){const s=sourceInfo(source);return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(label??s.name)} ↗</a>`;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function openDialog(id){$(id).showModal();}
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close();}));

function setTab(tab,updateHash=true){
  if(!['map','facts','syllabus'].includes(tab))tab='map';
  state.tab=tab;
  for(const view of ['map','facts','syllabus'])$(`#${view}-view`).hidden=view!==tab;
  $$('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===tab);if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(tab!=='map')stopPlay();
  if(tab==='map'&&data)requestAnimationFrame(syncSymbols);
  if(updateHash&&location.hash!==`#${tab}`)history.replaceState(null,'',`#${tab}`);
  requestAnimationFrame(syncGlassNavigation);
}
function syncGlassNavigation(){
  const nav=$('.tabs'),active=nav.querySelector('[data-tab].active');if(!active)return;
  nav.style.setProperty('--tab-x',`${active.offsetLeft}px`);
  nav.style.setProperty('--tab-width',`${active.offsetWidth}px`);
}
function initGlassControls(){
  // Keep the fixed phone dock outside the blurred header: backdrop-filter
  // would otherwise make that header the dock's fixed-position container.
  const nav=$('.tabs'),home=document.createComment('desktop navigation position');
  nav.before(home);
  const phone=matchMedia('(max-width:700px)');
  const placeNavigation=()=>{
    if(phone.matches)document.body.append(nav);
    else home.parentNode.insertBefore(nav,home.nextSibling);
    requestAnimationFrame(syncGlassNavigation);
  };
  phone.addEventListener('change',placeNavigation);placeNavigation();
  new ResizeObserver(()=>requestAnimationFrame(syncGlassNavigation)).observe($('.tabs'));
  document.fonts.ready.then(syncGlassNavigation);
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  let pending=0,target,point;
  document.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||reducedMotion.matches)return;
    const surface=event.target.closest?.('.tabs,.layer-tabs button,.install');if(!surface)return;
    target=surface;point=[event.clientX,event.clientY];
    if(pending)return;
    pending=requestAnimationFrame(()=>{
      pending=0;const rect=target.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      target.style.setProperty('--light-x',`${Math.max(0,Math.min(100,(point[0]-rect.left)/rect.width*100))}%`);
      target.style.setProperty('--light-y',`${Math.max(0,Math.min(100,(point[1]-rect.top)/rect.height*100))}%`);
    });
  },{passive:true});
  $('#timeline-slider').addEventListener('input',updateGlassSlider);
  updateGlassSlider();
}
function updateGlassSlider(){
  const slider=$('#timeline-slider'),progress=(Number(slider.value)-Number(slider.min))/(Number(slider.max)-Number(slider.min))*100;
  slider.style.setProperty('--history-progress',`${progress}%`);
}
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
window.addEventListener('hashchange',()=>setTab(location.hash.slice(1),false));

function divisionMatches(d){return !state.division||d.division===state.division;}
function recordMatchesDivision(r){return !state.division||r.districts.some(n=>divisionMatches(districtByName.get(n)));}
function matchesSearch(r){return !state.search||[r.name,r.bn,r.division,r.category,r.note,...(r.districts??[]),...(r.landmarks??[])].filter(Boolean).join(' ').toLowerCase().includes(state.search);}
function districtContent(d){
  const gis=data.gi.filter(g=>g.districts.includes(d.name));
  const communities=data.communities.filter(c=>c.districts.includes(d.name));
  const places=data.places.filter(p=>p.districts.includes(d.name));
  return `<article class="detail-card"><div class="detail-body"><span class="eyebrow">${esc(d.division.toUpperCase())} DIVISION · DISTRICT</span><h2>${esc(d.name)}</h2><div class="detail-bn" lang="bn">${esc(d.bn)}</div><p>${esc(d.note)}</p><div class="detail-section"><h4>Remember this place</h4><ul>${d.landmarks.map(l=>`<li>${esc(l)}</li>`).join('')}</ul></div><div class="detail-section"><h4>River connections</h4><p>${d.rivers.map(esc).join(' · ')}</p></div><div class="detail-section"><h4>GI study associations · ${gis.length}</h4>${gis.length?`<div class="tag-list">${gis.map(g=>`<button data-record="${g.id}" data-kind="gi">${esc(g.name)}</button>`).join('')}</div>`:'<p>No district association in this registry snapshot. This does not mean that the district has no local specialities.</p>'}</div>${communities.length?`<div class="detail-section"><h4>Community associations</h4><div class="tag-list">${communities.map(c=>`<button data-record="${c.id}" data-kind="communities">${esc(c.name)}</button>`).join('')}</div></div>`:''}${places.length?`<div class="detail-section"><h4>On the place map</h4><div class="tag-list">${places.map(p=>`<button data-record="${p.id}" data-kind="${p.kind==='Nature'?'nature':'places'}">${esc(p.name)}</button>`).join('')}</div></div>`:''}<div class="detail-section detail-actions"><button class="primary" data-district-facts="${esc(d.name)}">Related study facts →</button><button data-focus-district="${esc(d.name)}">Focus on map ↑</button></div></div><div class="source-link">${sourceLink(d.source,'District reference · Banglapedia')}</div></article>`;
}
function overviewContent(){
  const copy={districts:['Start with a place','Tap a district on the map, or find it in the directory. Connect rivers and landmarks with products, people and history.'],gi:['Origin tells a story','Explore all 64 registrations in the saved DPDT registry. Badges count district study associations; country-wide products remain in the directory.'],communities:['People make the map','Explore 20 community profiles. Badges show broad district associations, not exclusive territories. This is a selected study set, not a complete census inventory.'],places:['Remember by location','Explore archaeological sites, memorials and transport connections. Select a marker to link a place with its story.'],nature:['Read the landscape','Explore forests, wetlands, terraces and coastlines. The notes connect landscapes with broad environmental and hazard themes, not measured risk or live warnings.']};
  const [title,body]=copy[state.layer]??copy.districts;
  return `<article class="detail-card"><div class="overview-art" aria-hidden="true"><span>Places. People.<br>Connections.</span><div class="sun"></div></div><div class="detail-body"><span class="eyebrow">WELCOME TO BANGLADESH</span><h2>${title}</h2><p>${body}</p><div class="detail-metrics"><div><strong>64</strong><span>district profiles</span></div><div><strong>24</strong><span>history stops</span></div><div><strong>${FACTS.length}</strong><span>study cards</span></div><div><strong>14</strong><span>syllabus topics</span></div></div></div></article>`;
}
function recordContent(record){
  const isGi=state.layer==='gi',isCommunity=state.layer==='communities';
  const headline=isGi?`GI REGISTRATION #${record.number}`:isCommunity?'COMMUNITY PROFILE':record.kind.toUpperCase();
  return `<article class="detail-card"><div class="detail-body"><span class="eyebrow">${esc(headline)}</span><h2>${esc(record.name)}</h2><div class="detail-bn" lang="bn">${esc(record.bn)}</div>${isGi?`<p>${esc(record.category)} · Registered in the DPDT list updated 16 June 2026.</p><div class="detail-section"><h4>Registry details</h4><p>Application: ${esc(record.application)}<br>Application date: ${esc(record.applicationDate)}<br>Registration number: ${record.number}</p><p>The date above is the application date, not the registration date.</p></div>`:`<p>${esc(record.note)}</p>`}<div class="detail-section"><h4>${isCommunity?'Examples of district presence':'Study location associations'}</h4>${record.districts.length?`<div class="tag-list">${record.districts.map(n=>`<button data-district="${esc(n)}">${esc(n)}</button>`).join('')}</div>`:'<p>A country-wide product. No single district marker is assigned.</p>'}</div><div class="detail-section"><p>${isGi?esc(record.scope)+'. District associations are indicative and are not the legal production boundaries.':isCommunity?'Communities also live outside these districts. Cultural traditions vary among individuals and localities.':'Coordinates are indicative study locations, not navigation guidance.'}</p></div>${isGi?'<div class="detail-section"><p>GI protects a place-linked name or reputation. It is different from a general popularity claim and from UNESCO recognition.</p></div>':''}</div><div class="source-link">${sourceLink(record.source)}</div></article>`;
}
function historyContent(){
  const e=TIMELINE[state.history];
  return `<article class="detail-card"><div class="detail-body"><span class="eyebrow">${esc(e.era.toUpperCase())}</span><span class="history-date">${esc(e.date)}</span><h2>${esc(e.title)}</h2><div class="detail-bn" lang="bn">${esc(e.bn)}</div><p>${esc(e.body)}</p><div class="detail-section"><h4>Places on today's map</h4>${e.districts.length?`<div class="tag-list">${e.districts.map(n=>`<button data-district="${esc(n)}">${esc(n)}</button>`).join('')}</div>`:'<p>This event has no single Bangladesh district anchor.</p>'}</div><div class="detail-section"><p>The highlighted places are event or heritage associations. They do not represent historic borders or political control.</p></div><div class="history-progress">Stop ${state.history+1} of ${TIMELINE.length} · Use the slider or arrow keys.</div></div><div class="source-link">${sourceLink(e.source)}</div></article>`;
}
function renderDetail(){
  $('#detail').innerHTML=state.record?recordContent(state.record):state.district?districtContent(districtByName.get(state.district)):state.layer==='history'?historyContent():overviewContent();
}
function renderDirectory(){
  let records;
  if(state.layer==='districts')records=data.districtInfo.filter(d=>divisionMatches(d)&&matchesSearch(d)).sort((a,b)=>a.name.localeCompare(b.name));
  else if(state.layer==='history')records=TIMELINE.map((e,i)=>({...e,id:i,name:e.title,bn:e.bn,index:i})).filter(e=>recordMatchesDivision(e)&&matchesSearch(e));
  else records=(state.layer==='gi'?data.gi:state.layer==='communities'?data.communities:data.places.filter(p=>state.layer==='nature'?p.kind==='Nature':p.kind!=='Nature')).filter(r=>recordMatchesDivision(r)&&matchesSearch(r));
  $('#directory-title').textContent=layerInfo[state.layer][2];$('#directory-count').textContent=records.length+' shown';$('#directory-empty').hidden=records.length>0;
  $('#directory').classList.toggle('history-list',state.layer==='history');
  $('#directory').innerHTML=records.map(r=>{
    const isDistrict=state.layer==='districts',isHistory=state.layer==='history';
    const active=isDistrict?state.district===r.name:isHistory?state.history===r.index:state.record?.id===r.id;
    const subtitle=isDistrict?`${r.bn} · ${r.division}`:isHistory?r.date:`${r.bn}${state.layer==='gi'?` · #${r.number}`:''}`;
    return `<button class="directory-item ${active?'active':''}" ${isDistrict?`data-district="${esc(r.name)}"`:isHistory?`data-history="${r.index}"`:`data-record="${r.id}" data-kind="${state.layer}"`} ${active?'aria-current="true"':''}><span><strong>${esc(r.name)}</strong><small>${esc(subtitle)}</small></span>${isDistrict?`<span class="item-dot" style="background:${colors[r.division]}"></span>`:'<span aria-hidden="true">↗</span>'}</button>`;
  }).join('');
  if(state.layer==='districts'){
    const names=new Set(records.map(r=>r.name));d3.selectAll('.district').classed('dim',d=>!names.has(d.properties.name));
  }
}
function selectDistrict(name,focus=false){
  if(!districtByName.has(name))return;
  state.district=name;state.record=null;state.explored.add(name);storage.set('ba-explored',[...state.explored]);
  $('#explored-count').textContent=`${state.explored.size} / 64 districts explored`;
  renderDetail();renderDirectory();updateDistrictStyles();syncSymbols();
  if(focus)focusDistricts([name]);
  if(innerWidth<=700)$('#detail').scrollIntoView({block:'start',behavior:'instant'});
}
function selectRecord(id,kind){
  const records=kind==='gi'?data.gi:kind==='communities'?data.communities:data.places;
  const record=records.find(r=>r.id===id);if(!record)return;
  if(state.layer!==kind)setLayer(kind);
  state.record=record;state.district=null;renderDetail();renderDirectory();updateDistrictStyles();renderMarkers();
  if(record.districts.length)focusDistricts(record.districts);
  if(innerWidth<=700)$('#detail').scrollIntoView({block:'start',behavior:'instant'});
}
function focusDistricts(names){
  const fs=names.map(n=>featureByName.get(n)).filter(Boolean);if(!fs.length)return;
  const bounds=path.bounds({type:'FeatureCollection',features:fs});
  const [[x0,y0],[x1,y1]]=bounds,k=Math.min(5,.72/Math.max((x1-x0)/850,(y1-y0)/640));
  const t=d3.zoomIdentity.translate(425-k*(x0+x1)/2,320-k*(y0+y1)/2).scale(k);
  applyTransform(t);
}
function applyTransform(t){d3.select('#map').call(zoom.transform,t);}
function setLayer(layer){
  if(!layerInfo[layer])return;
  stopPlay();state.layer=layer;state.record=null;state.district=null;
  const [kicker,title,,count]=layerInfo[layer];$('#layer-kicker').textContent=kicker;$('#map-title').textContent=title;$('#map-count').textContent=count;
  $$('[data-layer]').forEach(b=>{b.classList.toggle('active',b.dataset.layer===layer);b.setAttribute('aria-pressed',String(b.dataset.layer===layer));});
  $('#timeline-panel').hidden=layer!=='history';
  $('#rivers-toggle').checked=layer==='nature';d3.select('#river-paths').style('display',layer==='nature'?null:'none');
  $('#map-note').textContent=layer==='gi'?'Badges count district study associations. GI production areas may span several districts. Country-wide products are listed without a single location.':layer==='communities'?'Selected community profiles. District associations are examples of presence, not exclusive territories or exact settlement locations.':layer==='nature'?'Markers show landscape study locations. Hazard notes are qualitative; this map is not a risk model or a live warning service.':layer==='history'?'Historical events and heritage anchors are highlighted on 2020 district boundaries. This is not a reconstruction of historical borders.':'Select a district or marker to explore. Move two fingers to pan; pinch to zoom. Trackpad scrolling pans; + / − zooms. BBS / OCHA boundaries, 2020, via geoBoundaries.';
  updateDistrictStyles();renderLegend();renderDirectory();renderMarkers();renderDetail();if(layer==='history')updateHistory(false);
}
function updateDistrictStyles(){
  const relevant=state.layer==='history'?TIMELINE[state.history].districts:state.record?.districts??[];
  d3.selectAll('.district').classed('selected',d=>state.district===d.properties.name||state.layer!=='history'&&relevant.includes(d.properties.name)).classed('history-active',d=>state.layer==='history'&&relevant.includes(d.properties.name)).classed('dim',d=>!divisionMatches(districtByName.get(d.properties.name)));
}
function renderLegend(){
  $('#map-legend').innerHTML=state.layer==='districts'?divisions.map(d=>`<span><i style="background:${colors[d]}"></i>${d}</span>`).join(''):state.layer==='gi'?'<span><i style="background:#bc7e32"></i>Badge = number of associated GI products</span><span>Country-wide entries remain in the directory</span>':state.layer==='communities'?'<span><i style="background:#90647b"></i>Badge = selected community associations</span>':state.layer==='history'?'<span><i style="background:#d56750"></i>Event or heritage association</span><span>2020 district boundaries</span>':'<span><i style="background:#277d76"></i>Landscape</span><span><i style="background:#d56750"></i>Heritage</span><span><i style="background:#bc7e32"></i>Infrastructure</span>';
}
function renderMarkers(){
  const group=d3.select('#markers');group.selectAll('*').remove();let points=[];
  if(['gi','communities'].includes(state.layer)){
    const records=state.layer==='gi'?data.gi:data.communities;
    for(const d of data.districtInfo){const rs=records.filter(r=>r.districts.includes(d.name)&&matchesSearch(r));if(rs.length&&divisionMatches(d))points.push({id:d.id,name:d.name,coords:metricsByName.get(d.name).center,count:rs.length,color:state.layer==='gi'?'#b77b31':'#916780',district:d.name});}
  }else if(['places','nature'].includes(state.layer)){
    points=data.places.filter(p=>(state.layer==='nature'?p.kind==='Nature':p.kind!=='Nature')&&recordMatchesDivision(p)&&matchesSearch(p)).map(p=>({...p,coords:projection(p.coords),color:p.kind==='Nature'?'#277d76':p.kind==='Heritage'?'#d56750':'#bc7e32'}));
  }
  const marker=group.selectAll('g').data(points).join('g').attr('class','marker').attr('tabindex',0).attr('role','button').attr('aria-label',p=>p.count?`${p.name}: ${p.count} ${state.layer==='gi'?'GI products':'community associations'}`:p.name).classed('selected',p=>state.record?.id===p.id);
  marker.append('circle').attr('r',p=>p.count?11:8).attr('fill',p=>p.color);marker.filter(p=>p.count).append('text').attr('dy','.35em').text(p=>p.count);
  marker.on('click',(e,p)=>{e.stopPropagation();p.district?selectDistrict(p.district):selectRecord(p.id,state.layer);}).on('keydown',(e,p)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();p.district?selectDistrict(p.district):selectRecord(p.id,state.layer);}}).on('pointermove',(e,p)=>showTooltip(e,p.count?`${p.name} · ${p.count} associations`:p.name)).on('pointerleave',hideTooltip);
  syncSymbols();
}
function showTooltip(event,label){
  const r=$('#map-area').getBoundingClientRect(),tip=$('#map-tooltip');tip.textContent=label;tip.hidden=false;tip.style.left=Math.max(8,Math.min(event.clientX-r.left+12,r.width-tip.offsetWidth-10))+'px';tip.style.top=Math.max(4,Math.min(event.clientY-r.top-34,r.height-45))+'px';
}
function hideTooltip(){$('#map-tooltip').hidden=true;}
function syncSymbols(){
  if(!data||state.tab!=='map')return;
  const svg=$('#map'),narrow=svg.getBoundingClientRect().width<600;
  const desired=narrow?'180 0 500 640':'0 0 850 640';
  if(svg.getAttribute('viewBox')!==desired){svg.setAttribute('viewBox',desired);zoom?.extent(narrow?[[180,0],[680,640]]:[[0,0],[850,640]]);}
  const vb=svg.viewBox.baseVal,k=state.transform.k,ui=svg.getBoundingClientRect().width/vb.width||1;
  d3.selectAll('.marker').attr('transform',p=>`translate(${p.coords[0]},${p.coords[1]}) scale(${1/(k*ui)})`);
  const showDistricts=$('#labels').checked||k>2.2,boxes=[];
  const labels=d3.selectAll('.district-label');
  const order=showDistricts?data.districtInfo.slice().sort((a,b)=>(b.name===state.district)-(a.name===state.district)||metricsByName.get(b.name).area-metricsByName.get(a.name).area):[];
  const visibility=new Set();
  if(showDistricts)for(const d of order){
    if(!divisionMatches(d))continue;
    const c=metricsByName.get(d.name).center,x=(c[0]*k+state.transform.x-vb.x)*ui,y=(c[1]*k+state.transform.y-vb.y)*ui,w=d.name.length*5.4+10;
    if(x<15||x>vb.width*ui-15||y<15||y>vb.height*ui-15)continue;
    const box={l:x-w/2,r:x+w/2,t:y-8,b:y+8};
    if(d.name===state.district||!boxes.some(b=>box.l<b.r&&box.r>b.l&&box.t<b.b&&box.b>b.t)){visibility.add(d.name);boxes.push(box);}
  }
  labels.attr('transform',d=>{const [x,y]=metricsByName.get(d.properties.name).center;return `translate(${x},${y}) scale(${1/(k*ui)})`;}).attr('font-size',11).style('font-size','11px').style('display',d=>visibility.has(d.properties.name)?null:'none').classed('selected-label',d=>d.properties.name===state.district);
  d3.selectAll('.division-label').attr('transform',d=>{const [x,y]=projection(d.coords);return `translate(${x},${y}) scale(${1/(k*ui)})`;}).style('font-size',`${ui<.6?10:12}px`).style('display',showDistricts||state.layer!=='districts'? 'none':null);
}
function initMap(){
  geo=data.districts;
  // D3's spherical polygon winding is opposite GeoJSON's common RFC 7946 winding.
  for(const f of geo.features)if(d3.geoArea(f)>2*Math.PI){const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;for(const p of polys)for(const ring of p)ring.reverse();}
  projection=d3.geoMercator().fitExtent([[105,35],[740,583]],geo);path=d3.geoPath(projection);
  featureByName=new Map(geo.features.map(f=>[f.properties.name,f]));districtByName=new Map(data.districtInfo.map(d=>[d.name,d]));
  // Projection stays fixed during gestures; only the parent SVG transform changes.
  metricsByName=new Map(geo.features.map(f=>[f.properties.name,{center:path.centroid(f),area:path.area(f)}]));
  const world=d3.select('#geography');
  world.append('g').attr('id','district-paths').selectAll('path').data(geo.features).join('path').attr('class','district').attr('d',path).attr('fill',d=>colors[districtByName.get(d.properties.name).division]).attr('tabindex',0).attr('role','button').attr('aria-label',d=>`${d.properties.name} district, ${districtByName.get(d.properties.name).division} division`).on('click',(e,d)=>{e.stopPropagation();selectDistrict(d.properties.name);}).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectDistrict(d.properties.name);}}).on('pointermove',(e,d)=>showTooltip(e,d.properties.name+' · '+districtByName.get(d.properties.name).bn)).on('pointerleave',hideTooltip);
  world.append('defs').append('clipPath').attr('id','country-clip').append('path').attr('d',path(geo));
  world.append('g').attr('id','river-paths').attr('clip-path','url(#country-clip)').style('display','none').selectAll('path').data(data.rivers.features).join('path').attr('d',path).attr('class','river').append('title').text(d=>`${d.properties.name??'River centreline'} · Natural Earth 1:10m, generalized`);
  world.append('g').attr('id','markers');
  world.append('g').attr('aria-hidden','true').selectAll('text').data(geo.features).join('text').attr('class','district-label').text(d=>d.properties.name);
  const anchors=[['Rangpur',89.09,25.76],['Rajshahi',88.86,24.58],['Mymensingh',90.22,24.91],['Sylhet',91.66,24.80],['Dhaka',90.09,23.86],['Khulna',89.14,22.96],['Barishal',90.30,22.47],['Chattogram',91.91,23.01]].map(([name,x,y])=>({name,coords:[x,y]}));
  world.append('g').attr('aria-hidden','true').selectAll('text').data(anchors).join('text').attr('class','division-label').text(d=>d.name.toUpperCase());
  // Bind touch handlers explicitly, including on hybrid computers whose device
  // detection can omit them. D3 tracks both fingers for pinch and midpoint pan.
  zoom=d3.zoom().touchable(()=>true).scaleExtent([1,9]).extent([[0,0],[850,640]]).translateExtent([[-150,-100],[1000,750]]).filter(e=>(e.type!=='wheel'||e.ctrlKey)&&(!e.button||e.type==='wheel')).on('zoom',e=>{state.transform=e.transform;world.attr('transform',e.transform);hideTooltip();syncSymbols();});
  d3.select('#map').call(zoom).on('dblclick.zoom',null);
  // Trackpad two-finger scrolling arrives as ordinary wheel deltas; pinch
  // arrives as Ctrl+wheel and stays with D3's zoom handler above.
  $('#map').addEventListener('wheel',event=>{
    if(event.ctrlKey)return;
    const svg=event.currentTarget,matrix=svg.getScreenCTM();if(!matrix)return;
    event.preventDefault();
    const units=event.deltaMode===1?16:event.deltaMode===2?svg.getBoundingClientRect().height:1;
    const inverse=matrix.inverse(),dx=event.deltaX*units,dy=event.deltaY*units;
    const x=dx*inverse.a+dy*inverse.c,y=dx*inverse.b+dy*inverse.d;
    d3.select(svg).call(zoom.translateBy,-x/state.transform.k,-y/state.transform.k);
  },{passive:false});
  $('#zoom-in').addEventListener('click',()=>d3.select('#map').call(zoom.scaleBy,1.5));$('#zoom-out').addEventListener('click',()=>d3.select('#map').call(zoom.scaleBy,1/1.5));$('#zoom-reset').addEventListener('click',()=>applyTransform(d3.zoomIdentity));$('#labels').addEventListener('change',syncSymbols);
  $('#rivers-toggle').addEventListener('change',e=>d3.select('#river-paths').style('display',e.target.checked?null:'none'));
  new ResizeObserver(syncSymbols).observe($('#map'));
  $('#map-loading').hidden=true;
  $('#division').innerHTML='<option value="">All divisions</option>'+divisions.map(d=>`<option>${d}</option>`).join('');
  renderLegend();renderDirectory();renderDetail();syncSymbols();
}

function stopPlay(){clearInterval(playTimer);playTimer=null;$('#timeline-play').textContent='▶';$('#timeline-play').setAttribute('aria-label','Play history timeline');}
function updateHistory(clearSelection=true){
  if(clearSelection){state.district=null;state.record=null;}
  const e=TIMELINE[state.history];$('#timeline-slider').value=state.history;$('#timeline-slider').setAttribute('aria-valuetext',`${e.date}: ${e.title}`);$('#timeline-date').textContent=e.date;$('#timeline-prev').disabled=state.history===0;$('#timeline-next').disabled=state.history===TIMELINE.length-1;
  updateGlassSlider();
  updateDistrictStyles();renderDetail();renderDirectory();
}
$('#timeline-slider').addEventListener('input',e=>{stopPlay();state.history=Number(e.target.value);updateHistory();});
$('#timeline-prev').addEventListener('click',()=>{stopPlay();state.history=Math.max(0,state.history-1);updateHistory();});
$('#timeline-next').addEventListener('click',()=>{stopPlay();state.history=Math.min(TIMELINE.length-1,state.history+1);updateHistory();});
$('#timeline-play').addEventListener('click',()=>{if(playTimer)return stopPlay();if(state.history===TIMELINE.length-1)state.history=0;updateHistory();$('#timeline-play').textContent='Ⅱ';$('#timeline-play').setAttribute('aria-label','Pause history timeline');playTimer=setInterval(()=>{if(state.history>=TIMELINE.length-1)return stopPlay();state.history++;updateHistory();},4500);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlay();});

function renderFacts(){
  const q=state.factSearch.toLowerCase();
  const facts=FACTS.filter(f=>(state.topic==='all'||f.topic===state.topic)&&(!state.savedOnly||state.saved.has(f.id))&&(!q||[f.title,f.bn,f.body,f.recall,...f.districts].join(' ').toLowerCase().includes(q)));
  $('#facts-heading').textContent=state.topic==='all'?'All Bangladesh facts':TOPICS.find(t=>t.id===state.topic).name;$('#facts-count').textContent=`${facts.length} cards${state.savedOnly?' · saved':''}`;$('#saved-count').textContent=state.saved.size;$('#facts-empty').hidden=facts.length>0;
  $('#fact-cards').innerHTML=facts.map(f=>`<article class="fact-card"><div class="fact-card-top"><span class="eyebrow">${esc(TOPICS.find(t=>t.id===f.topic).name.toUpperCase())}</span><button class="save-btn" data-save="${f.id}" aria-label="${state.saved.has(f.id)?'Unsave':'Save'} ${esc(f.title)}" aria-pressed="${state.saved.has(f.id)}">${state.saved.has(f.id)?'♥':'♡'}</button></div><h4>${esc(f.title)}</h4><div class="bn" lang="bn">${esc(f.bn)}</div><p>${esc(f.body)}</p><div class="recall" lang="bn"><small lang="en">MEMORY CONNECTION</small>${esc(f.recall)}</div><div class="fact-card-footer">${sourceLink(f.source,'Read source')}${f.districts.length?`<button data-fact-map="${f.id}">See on map ↗</button>`:'<span></span>'}</div></article>`).join('');
  $$('[data-topic]').forEach(b=>b.classList.toggle('active',b.dataset.topic===state.topic));
}
function initFacts(){
  $('#fact-total').textContent=FACTS.length;
  $('#topic-filters').innerHTML='<button data-topic="all" class="active">All topics</button>'+TOPICS.map((t,i)=>`${[0,9].includes(i)?`<span class="topic-group">${esc(t.group)}</span>`:''}<button data-topic="${t.id}">${esc(t.name)}</button>`).join('');
  $('#syllabus-cards').innerHTML=TOPICS.map((t,i)=>`<article class="syllabus-card"><p class="eyebrow">${esc(t.group.toUpperCase())} · TOPIC ${i<9?i+1:i-8}</p><div class="syllabus-title"><span class="topic-number">${t.n}</span><h3 lang="bn">${esc(t.bn)}</h3></div><p lang="bn">${esc(t.syllabus)}</p><button data-topic-open="${t.id}">Explore ${FACTS.filter(f=>f.topic===t.id).length} study cards →</button></article>`).join('');renderFacts();
}
function openTopic(topic){state.topic=topic;state.factSearch='';state.savedOnly=false;$('#facts-search').value='';$('#saved-only').setAttribute('aria-pressed','false');setTab('facts');renderFacts();window.scrollTo({top:0,behavior:'instant'});}
$('#facts-search').addEventListener('input',e=>{state.factSearch=e.target.value.trim();renderFacts();});
$('#saved-only').addEventListener('click',()=>{state.savedOnly=!state.savedOnly;$('#saved-only').setAttribute('aria-pressed',String(state.savedOnly));renderFacts();});

function initSources(){
  $('#sources-content').innerHTML=`<div class="callout">Content assembled 12 October 2026. GI snapshot: 16 June 2026. Geometry represents 2020 district boundaries. This app works offline; external reference links do not.</div><p>The syllabus text comes from your two supplied images. Study cards are concise explanatory notes, not a complete textbook or a claim of an official exam syllabus. District spelling variants are normalized to the names shown in the directory.</p><p>GI badges show study associations, not legal production polygons. Community profiles are a selected set, with non-exclusive district associations. Nature markers show qualitative landscape connections. Historical highlights use modern district boundaries and do not reconstruct historic territory.</p>${Object.values(SOURCES).map(s=>`<div class="source-row">${sourceLink(s.url,s.name)}<p>${esc(s.note)}</p></div>`).join('')}<div class="source-row"><a href="https://en.banglapedia.org/" target="_blank" rel="noopener noreferrer">Banglapedia · National Encyclopedia of Bangladesh ↗</a><p>District, community and historical references are linked on individual cards. Older reference statistics and terminology should be read in their historical context.</p></div><div class="source-row"><a href="https://github.com/d3/d3" target="_blank" rel="noopener noreferrer">D3 v7.9.0 · ISC licence ↗</a><p>Locally bundled map library. Bangladesh boundary attribution: BBS / OCHA ROAP via geoBoundaries, CC BY 3.0 IGO. Geometry is simplified for browser use; it is not a legal or cadastral map.</p></div><div class="source-row"><p>Progress and saved cards are stored only in this browser. No accounts, analytics or location tracking.</p><button id="clear-progress">Clear saved cards & explored progress</button></div>`;
  $('#clear-progress').addEventListener('click',()=>{state.saved.clear();state.explored.clear();storage.set('ba-saved',[]);storage.set('ba-explored',[]);$('#explored-count').textContent='0 / 64 districts explored';renderFacts();toast('Saved cards and explored progress cleared.');});
}

let quizIndex=0,quizScore=0,quizAnswered=false;
function renderQuiz(){
  quizAnswered=false;
  if(quizIndex>=QUIZ.length){$('#quiz-content').innerHTML=`<div class="quiz-finish">${quizScore} / ${QUIZ.length}</div><p>Keep connecting the facts with places. Review the study cards, then try again.</p><button class="primary" id="quiz-restart">Try again</button>`;$('#quiz-restart').addEventListener('click',()=>{quizIndex=0;quizScore=0;renderQuiz();});return;}
  const q=QUIZ[quizIndex];$('#quiz-content').innerHTML=`<p class="quiz-progress">Question ${quizIndex+1} of ${QUIZ.length} · ${quizScore} correct</p><h3 class="quiz-question">${esc(q[0])}</h3><div class="quiz-options">${q[1].map((o,i)=>`<button data-answer="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div><div id="quiz-feedback" class="quiz-feedback" aria-live="polite"></div>`;
}
$('#practice').addEventListener('click',()=>{quizIndex=0;quizScore=0;renderQuiz();openDialog('#quiz-dialog');});
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.answer!==undefined&&!quizAnswered){quizAnswered=true;const q=QUIZ[quizIndex],n=Number(b.dataset.answer);if(n===q[2])quizScore++;$$('[data-answer]').forEach(x=>{x.disabled=true;x.classList.toggle('correct',Number(x.dataset.answer)===q[2]);x.classList.toggle('wrong',x===b&&n!==q[2]);});$('#quiz-feedback').innerHTML=`<p>${n===q[2]?'Correct.':'Good one to revisit.'} ${esc(q[3])}</p>${sourceLink(q[4],'Explanation source')}<button class="primary" id="quiz-next">${quizIndex===QUIZ.length-1?'Finish':'Next'} →</button>`;}
  if(b.id==='quiz-next'){quizIndex++;renderQuiz();}
  if(b.dataset.topic!==undefined){state.topic=b.dataset.topic;renderFacts();}
  if(b.dataset.topicOpen)openTopic(b.dataset.topicOpen);
  if(b.dataset.save){const id=b.dataset.save;state.saved.has(id)?state.saved.delete(id):state.saved.add(id);storage.set('ba-saved',[...state.saved]);renderFacts();}
  if(b.dataset.factMap){const f=FACTS.find(f=>f.id===b.dataset.factMap);setTab('map');setLayer('districts');selectDistrict(f.districts[0]);focusDistricts(f.districts);$('#map-area').scrollIntoView({block:'center',behavior:'instant'});}
  if(b.dataset.districtFacts){state.topic='all';state.factSearch=b.dataset.districtFacts;state.savedOnly=false;$('#facts-search').value=state.factSearch;$('#saved-only').setAttribute('aria-pressed','false');setTab('facts');renderFacts();window.scrollTo({top:0,behavior:'instant'});}
  if(b.dataset.district&&data)selectDistrict(b.dataset.district,b.closest('#detail')!==null);
  if(b.dataset.focusDistrict&&data){focusDistricts([b.dataset.focusDistrict]);$('#map-area').scrollIntoView({block:'center',behavior:'instant'});}
  if(b.dataset.record&&data)selectRecord(b.dataset.record,b.dataset.kind);
  if(b.dataset.history!==undefined&&data){stopPlay();state.history=Number(b.dataset.history);updateHistory();}
  if(b.dataset.action==='sources')openDialog('#sources-dialog');
});
$('#about').addEventListener('click',()=>openDialog('#sources-dialog'));
$('#map-search').addEventListener('input',e=>{state.search=e.target.value.trim().toLowerCase();if(data){updateDistrictStyles();renderDirectory();renderMarkers();}});
$('#division').addEventListener('change',e=>{state.division=e.target.value;state.district=null;state.record=null;updateDistrictStyles();renderDirectory();renderMarkers();renderDetail();if(state.division)focusDistricts(data.districtInfo.filter(d=>d.division===state.division).map(d=>d.name));else applyTransform(d3.zoomIdentity);});
$$('[data-layer]').forEach(b=>b.addEventListener('click',()=>{if(data)setLayer(b.dataset.layer);}));
$('#clear').addEventListener('click',()=>{if(!data)return;stopPlay();state.search='';state.division='';state.record=null;state.district=null;$('#map-search').value='';$('#division').value='';applyTransform(d3.zoomIdentity);setLayer(state.layer);});

function updateConnection(){const online=navigator.onLine;$('#connection').textContent=online?'● Online':'● Offline';if(!online)$('#offline-status').textContent='Offline · using saved app content';}
window.addEventListener('online',updateConnection);window.addEventListener('offline',updateConnection);updateConnection();
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install').textContent='Install app ↗';});
window.addEventListener('appinstalled',()=>{installPrompt=null;$('#install').textContent='Installed ✓';toast('Bangladesh affairs installed.');});
$('#install').addEventListener('click',async()=>{if(installPrompt){const p=installPrompt;installPrompt=null;await p.prompt();await p.userChoice;}else{$('#install-state').textContent=matchMedia('(display-mode: standalone)').matches?'You are already using the installed app.':!window.isSecureContext?'Installation and offline caching require HTTPS or localhost.':'If the app is already installed, Chrome may offer “Open in app” instead. The installation option can vary by Chrome version.';openDialog('#install-dialog');}});
initFacts();initSources();initGlassControls();setTab(location.hash.slice(1)||'map',false);
try{
  const names=['districts','district-info','gi','communities','places','metadata','rivers'];
  const results=await Promise.all(names.map(async name=>{const response=await fetch(`./assets/data/${name}.${['districts','rivers'].includes(name)?'geojson':'json'}`);if(!response.ok)throw new Error(`${name}: HTTP ${response.status}`);return response.json();}));
  data=Object.fromEntries(names.map((n,i)=>[n.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),results[i]]));
  state.saved=new Set([...state.saved].filter(id=>FACTS.some(f=>f.id===id)));state.explored=new Set([...state.explored].filter(n=>data.districtInfo.some(d=>d.name===n)));
  $('#explored-count').textContent=`${state.explored.size} / 64 districts explored`;initMap();window.dispatchEvent(new Event('atlas-ready'));
}catch(error){$('#map-loading').textContent='The atlas could not load. Reconnect and use Reload app to retry.';$('#map-loading').setAttribute('role','alert');$('#detail').innerHTML='<div class="detail-card"><div class="detail-body"><h2>Atlas unavailable</h2><p>The map data could not be loaded. Reconnect and use Reload app below to refresh its files.</p></div></div>';window.dispatchEvent(new Event('atlas-error'));console.error(error);}
