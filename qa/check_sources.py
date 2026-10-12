"""Inspect linked references without copying their prose into the public app."""
import concurrent.futures,json,re,time,urllib.request
from pathlib import Path
from lxml import html
ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'qa/research-cache';CACHE.mkdir(exist_ok=True)
records=[]
for file in ['district-info.json','communities.json','places.json']:
    for row in json.loads((ROOT/'assets/data'/file).read_text(encoding='utf-8')):
        if row['source'].startswith('https:'): records.append((row['name'],row['source'],row.get('landmarks',[])))
extra=ROOT/'qa/content-references.json'
if extra.exists():
    existing={r[1] for r in records}
    for row in json.loads(extra.read_text(encoding='utf-8')):
        if row['source'] not in existing: records.append((row['name'],row['source'],[]));existing.add(row['source'])
def check(row):
    name,url,terms=row
    if url in previous and previous[url].get('hasArticle'):return {**previous[url],'name':name}
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; BangladeshAffairsSourceReview/1.0)'})
        with urllib.request.urlopen(req,timeout=25) as response: text=response.read().decode('utf-8','replace');status=response.status
        tree=html.fromstring(text)
        parts=tree.xpath('//*[@id="mw-content-text"]') or tree.xpath('//main') or [tree]
        content=' '.join(' '.join(p.itertext()) for p in parts);content=re.sub(r'\s+',' ',content)
        (CACHE/(re.sub(r'[^a-zA-Z0-9]+','-',name)+'.txt')).write_text(content,encoding='utf-8')
        title=' '.join(tree.xpath('//title/text()'))
        return dict(name=name,url=url,status=status,title=title,length=len(content),excerpt=content[:180],hasArticle=len(content)>500 and 'There is currently no text in this page' not in content,anchors=[dict(term=t,found=t.lower().split(';')[0] in content.lower()) for t in terms])
    except Exception as error:return dict(name=name,url=url,error=str(error))
previous={}
prior=ROOT/'qa/source-results.json'
if prior.exists():previous={r['url']:r for r in json.loads(prior.read_text(encoding='utf-8'))}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool: results=list(pool.map(check,records))
(ROOT/'qa/source-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'references':len(results),'articles':sum(r.get('hasArticle',False) for r in results),'needsReview':[r for r in results if not r.get('hasArticle')]},ensure_ascii=False,indent=2))
