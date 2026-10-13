"""Build one signed APK using javac, D8, aapt2 and apksigner; no Gradle/framework."""
from pathlib import Path
import hashlib, json, os, secrets, shutil, subprocess, zipfile
ROOT=Path(__file__).resolve().parents[1]
BUILD=ROOT/'.android-build'; BUILD.mkdir(exist_ok=True)
paths=json.loads((BUILD/'tools/paths.json').read_text())
paths={k:str(Path(v) if Path(v).is_absolute() else ROOT/v) for k,v in paths.items()}
def run(*args):
    subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
run(paths.get('node','node'),'android/package_assets.cjs')
resources=BUILD/'res';shutil.copytree(ROOT/'android/res',resources,dirs_exist_ok=True)
(resources/'drawable').mkdir(exist_ok=True)
shutil.copy2(ROOT/'assets/icons/icon-512.png',resources/'drawable/app_icon.png')
compiled=BUILD/'resources.zip'
run(paths['aapt2'],'compile','--dir',resources,'-o',compiled)
unsigned=BUILD/'unsigned.apk'
run(paths['aapt2'],'link','-o',unsigned,'-I',paths['androidJar'],'--manifest',ROOT/'android/AndroidManifest.xml','-A',BUILD/'assets',compiled)
classes=BUILD/'classes';classes.mkdir(exist_ok=True)
sources=list((ROOT/'android/src').rglob('*.java'))
run(paths['javac'],'--release','8','-classpath',paths['androidJar'],'-d',classes,*sources)
classjar=BUILD/'classes.jar'
with zipfile.ZipFile(classjar,'w',zipfile.ZIP_DEFLATED) as z:
    for file in classes.rglob('*.class'):z.write(file,file.relative_to(classes).as_posix())
dex=BUILD/'dex';dex.mkdir(exist_ok=True)
run(paths['java'],'-cp',paths['d8Jar'],'com.android.tools.r8.D8','--release','--min-api','26','--lib',paths['androidJar'],'--output',dex,classjar)
assembled=BUILD/'assembled.apk'
with zipfile.ZipFile(unsigned,'r') as source,zipfile.ZipFile(assembled,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    # Normalize ZIP headers before alignment instead of rewriting aapt2's directory in place.
    for entry in source.infolist():z.writestr(entry.filename,source.read(entry.filename),compress_type=entry.compress_type)
    z.write(dex/'classes.dex','classes.dex')
aligned=BUILD/'aligned.apk'
run(paths['zipalign'],'-f','4',assembled,aligned)
signing=BUILD/'signing';signing.mkdir(exist_ok=True)
password=signing/'password.txt';key=signing/'bangladesh-affairs.jks'
if not key.exists():
    password.write_text(secrets.token_urlsafe(32))
    run(paths['keytool'],'-genkeypair','-keystore',key,'-alias','bangladesh-affairs','-storetype','PKCS12','-storepass:file',password,'-keypass:file',password,'-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Bangladesh Affairs, O=Bangladesh Affairs, C=BD')
DIST=ROOT.parent if ROOT.name=='Reproduce' else ROOT/'dist';DIST.mkdir(exist_ok=True)
apk=DIST/'Bangladesh-Affairs.apk'
run(paths['java'],'-jar',paths['apksignerJar'],'sign','--ks',key,'--ks-key-alias','bangladesh-affairs','--ks-pass','file:'+str(password),'--v1-signing-enabled','false','--v2-signing-enabled','true','--v3-signing-enabled','true','--v4-signing-enabled','false','--out',apk,aligned)
run(paths['java'],'-jar',paths['apksignerJar'],'verify','--verbose','--print-certs',apk)
run(paths['zipalign'],'-c','4',apk)
run(paths['aapt2'],'dump','badging',apk)
result={'apk':str(apk),'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'minAndroid':'8.0','permissions':[],'websiteRequired':False,'signingKey':str(key)}
(BUILD/'apk-results.json').write_text(json.dumps(result,indent=2))
for intermediate in [unsigned,assembled,aligned]:
    assert intermediate.resolve().is_relative_to(BUILD.resolve())
    intermediate.unlink(missing_ok=True)
print(json.dumps(result,indent=2))
