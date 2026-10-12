"""Package only public runtime files and deployment/reference documentation."""
from pathlib import Path
import hashlib,json,shutil,zipfile
ROOT=Path(__file__).resolve().parents[1]
public=ROOT/'github-pages';public.mkdir(exist_ok=True)
files=[ROOT/n for n in ['index.html','sw.js','manifest.webmanifest','.nojekyll','README.md','SOURCE_AUDIT.md','LICENSE','serve.cjs']]
files+=sorted(p for p in (ROOT/'assets').rglob('*') if p.is_file())
files += [ROOT/'sources/bangladesh-affairs-syllabus.png',ROOT/'sources/geography-environment-syllabus.png']
expected=set()
for src in files:
    relative=src.relative_to(ROOT);expected.add(relative.as_posix());dest=public/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
actual={p.relative_to(public).as_posix() for p in public.rglob('*') if p.is_file()}
assert actual==expected,'Public folder contains unexpected files'
archive=ROOT/'bangladesh-affairs-github-pages.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for name in sorted(expected):z.write(public/name,name)
with zipfile.ZipFile(archive) as z:
    assert set(z.namelist())==expected
    for name in expected:assert z.read(name)==(public/name).read_bytes(),name
result={'files':len(expected),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'folderZipParity':True,'publicFiles':sorted(expected)}
(ROOT/'qa/package-results.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='publicFiles'},indent=2))
