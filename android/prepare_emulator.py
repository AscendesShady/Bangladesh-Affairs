"""Prepare an isolated, headless Android emulator for APK-only testing."""
from pathlib import Path
import concurrent.futures, hashlib, json, os, subprocess, urllib.request, xml.etree.ElementTree as ET, zipfile
ROOT=Path(__file__).resolve().parents[1];BUILD=ROOT/'.android-build';SDK=BUILD/'sdk';SDK.mkdir(exist_ok=True)
def request(url):return urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=120)
with request('https://dl.google.com/android/repository/repository2-1.xml') as response:repo=ET.fromstring(response.read())
items=[]
for name in ['emulator','platform-tools']:
 package=next(n for n in repo if n.tag.endswith('remotePackage') and n.get('path')==name)
 archives=next(n for n in package if n.tag.endswith('archives'))
 archive=next(n for n in archives if any(c.tag.endswith('host-os') and c.text=='windows' for c in n))
 complete=next(n for n in archive if n.tag.endswith('complete'));info={n.tag.rsplit('}',1)[-1]:n.text for n in complete}
 items.append((name,'https://dl.google.com/android/repository/'+info['url'],info['checksum'],SDK))
items.append(('system-image','https://dl.google.com/android/repository/sys-img/android/x86_64-30_r11.zip','5e4de3946d46f88856c35efcc4d797b381456347',SDK/'system-images/android-30/default'))
def install(item):
 name,url,expected,target=item;archive=BUILD/'tools'/(name+'.zip');marker=BUILD/'tools'/(name+'.complete')
 if marker.exists() and marker.read_text()==expected:return
 def digest():
  h=hashlib.sha1()
  with archive.open('rb') as stream:
   for chunk in iter(lambda:stream.read(1024*1024),b''):h.update(chunk)
  return h.hexdigest()
 if not archive.exists() or digest()!=expected:
  print('Downloading Android test '+name,flush=True)
  with request(url) as response,archive.open('wb') as out:
   while chunk:=response.read(1024*1024):out.write(chunk)
 assert digest()==expected,'Download checksum mismatch'
 target.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(archive) as z:
  for entry in z.infolist():assert (target/entry.filename).resolve().is_relative_to(target.resolve())
  z.extractall(target)
 marker.write_text(expected);print(name+': verified',flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(install,items))
home=BUILD/'avd';home.mkdir(exist_ok=True);avd=home/'BangladeshAffairsQA.avd';avd.mkdir(exist_ok=True)
(home/'BangladeshAffairsQA.ini').write_text('avd.ini.encoding=UTF-8\npath='+avd.as_posix()+'\ntarget=android-30\n')
config={'AvdId':'BangladeshAffairsQA','avd.ini.displayname':'Bangladesh Affairs QA','abi.type':'x86_64','hw.cpu.arch':'x86_64','hw.cpu.ncore':'2','hw.ramSize':'1536','hw.lcd.width':'720','hw.lcd.height':'1280','hw.lcd.density':'240','hw.keyboard':'yes','hw.gpu.enabled':'yes','hw.gpu.mode':'swiftshader','image.sysdir.1':'system-images/android-30/default/x86_64/','tag.id':'default','tag.display':'Default','disk.dataPartition.size':'512M','showDeviceFrame':'no','skin.name':'720x1280','fastboot.forceColdBoot':'yes','PlayStore.enabled':'false'}
(avd/'config.ini').write_text('\n'.join(k+'='+v for k,v in config.items())+'\n')
environment=dict(os.environ,ANDROID_SDK_ROOT=str(SDK),ANDROID_AVD_HOME=str(home),ANDROID_I_WANT_MY_TCG='yes')
command=[str(SDK/'emulator/emulator.exe'),'-avd','BangladeshAffairsQA','-no-window','-no-audio','-no-snapshot','-no-boot-anim','-no-metrics','-show-kernel','-accel','off','-gpu','off','-feature','-Vulkan','-ports','5580,5581','-memory','1536']
log=(BUILD/'emulator.log').open('w')
process=subprocess.Popen(command,env=environment,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
(BUILD/'emulator-process.json').write_text(json.dumps({'pid':process.pid,'serial':'emulator-5580','adb':str(SDK/'platform-tools/adb.exe')},indent=2))
print('Owned test emulator started: PID '+str(process.pid),flush=True)
print('Keeping its parent session alive until the owned emulator is stopped.',flush=True)
raise SystemExit(process.wait())
