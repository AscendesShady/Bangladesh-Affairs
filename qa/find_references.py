import concurrent.futures,urllib.request,json
from lxml import html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
titles=['Chittagong_Hill_Tracts','Tribal_Culture','Tribal_Languages','Film_Industry','Bangladesh_Film_Development_Corporation','Pundravardhana','Hajongs','Hajang,_The','Tippera,_The','Tripuri,_The','Khumi,_The1','Khumi,_The_','Lawachara_National_Park1','Kamalganj_Upazila','Hatiya_Upazila','Bangladesh_Bank']
def check(title):
    try:
        url='https://en.banglapedia.org/index.php?title='+urllib.parse.quote(title,safe='%_,')
        with urllib.request.urlopen(url,timeout=15) as r:text=r.read().decode('utf-8')
        tree=html.fromstring(text);parts=tree.xpath('//*[@id="mw-content-text"]') or [tree];content=' '.join(' '.join(p.itertext()) for p in parts)
        return dict(title=title,url=url,length=len(content),excerpt=content[:400],links=[{'text':a.text_content(),'href':a.get('href')} for a in tree.xpath('//*[@id="mw-content-text"]//a') if a.get('href','').startswith('/index.php')][:100])
    except Exception as e:return dict(title=title,error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:results=list(pool.map(check,titles))
(ROOT/'qa/candidate-references.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps([{k:v for k,v in r.items() if k!='links'} for r in results if 'error' not in r],ensure_ascii=False,indent=2))
for r in results:
    if r['title']=='Chittagong_Hill_Tracts' and 'links' in r:print(json.dumps(r['links'],ensure_ascii=False))
