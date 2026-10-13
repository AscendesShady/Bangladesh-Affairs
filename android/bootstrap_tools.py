"""Download verified portable build tools; do not install anything globally."""
from pathlib import Path
import concurrent.futures, hashlib, json, urllib.request, xml.etree.ElementTree as ET, zipfile

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / '.android-build' / 'tools'
TOOLS.mkdir(parents=True, exist_ok=True)
def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}), timeout=120) as response:
        return response.read()
repo = ET.fromstring(fetch('https://dl.google.com/android/repository/repository2-1.xml'))
packages=[]
for name, folder in [('build-tools;36.0.0','build-tools'),('platforms;android-36','platform')]:
    package=next(n for n in repo if n.tag.endswith('remotePackage') and n.get('path')==name)
    archives=next(n for n in package if n.tag.endswith('archives'))
    archive=next(n for n in archives if not any(c.tag.endswith('host-os') for c in n) or any(c.tag.endswith('host-os') and c.text=='windows' for c in n))
    complete=next(n for n in archive if n.tag.endswith('complete'))
    info={n.tag.rsplit('}',1)[-1]:n.text for n in complete}
    packages.append({'name':name,'folder':folder,'url':'https://dl.google.com/android/repository/'+info['url'],'hash':info['checksum'],'algorithm':'sha1'})
jdk=json.loads(fetch('https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows&vendor=eclipse'))[0]['binary']['package']
packages.append({'name':'Temurin JDK 21','folder':'jdk','url':jdk['link'],'hash':jdk['checksum'],'algorithm':'sha256'})

def install(info):
    target=TOOLS/info['folder']; marker=target/'.complete'
    if marker.exists() and marker.read_text()==info['hash']:
        print(info['name']+': already verified',flush=True);return
    archive=TOOLS/(info['folder']+'.zip')
    def digest():
        h=hashlib.new(info['algorithm'])
        with archive.open('rb') as stream:
            for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
        return h.hexdigest()
    if not archive.exists() or digest()!=info['hash']:
        print('Downloading '+info['name'],flush=True)
        with urllib.request.urlopen(urllib.request.Request(info['url'],headers={'User-Agent':'Mozilla/5.0'}),timeout=120) as response,archive.open('wb') as out:
            while chunk:=response.read(1024*1024):out.write(chunk)
    assert digest()==info['hash'],'Download checksum mismatch: '+info['name']
    target.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        for member in z.infolist():
            destination=(target/member.filename).resolve()
            assert destination.is_relative_to(target.resolve()),'Unsafe archive path'
        z.extractall(target)
    marker.write_text(info['hash']);print(info['name']+': downloaded and verified',flush=True)

with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    list(pool.map(install,packages))
paths={'java':str(next((TOOLS/'jdk').rglob('java.exe'))),'javac':str(next((TOOLS/'jdk').rglob('javac.exe'))),'keytool':str(next((TOOLS/'jdk').rglob('keytool.exe'))),'androidJar':str(next((TOOLS/'platform').rglob('android.jar'))),'aapt2':str(next((TOOLS/'build-tools').rglob('aapt2.exe'))),'zipalign':str(next((TOOLS/'build-tools').rglob('zipalign.exe'))),'d8Jar':str(next((TOOLS/'build-tools').rglob('d8.jar'))),'apksignerJar':str(next((TOOLS/'build-tools').rglob('apksigner.jar')))}
(TOOLS/'paths.json').write_text(json.dumps(paths,indent=2))
print('Portable Android build tools ready.',flush=True)
