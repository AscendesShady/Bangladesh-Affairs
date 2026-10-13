"""Build temporary native instrumentation, excluded from the delivered APK."""
from pathlib import Path
import json, subprocess, zipfile
ROOT=Path(__file__).resolve().parents[1];BUILD=ROOT/'.android-build';paths=json.loads((BUILD/'tools/paths.json').read_text())
def run(*args):subprocess.run([str(a) for a in args],cwd=ROOT,check=True)
test=BUILD/'native-tests';test.mkdir(exist_ok=True);classes=test/'classes';classes.mkdir(exist_ok=True)
run(paths['javac'],'--release','8','-classpath',paths['androidJar'],'-d',classes,*list((ROOT/'android/test/src').rglob('*.java')))
jar=test/'classes.jar'
with zipfile.ZipFile(jar,'w',zipfile.ZIP_DEFLATED) as z:
 for file in classes.rglob('*.class'):z.write(file,file.relative_to(classes).as_posix())
dex=test/'dex';dex.mkdir(exist_ok=True)
run(paths['java'],'-cp',paths['d8Jar'],'com.android.tools.r8.D8','--release','--min-api','26','--lib',paths['androidJar'],'--output',dex,jar)
unsigned=test/'unsigned.apk'
run(paths['aapt2'],'link','-o',unsigned,'-I',paths['androidJar'],'--manifest',ROOT/'android/test/AndroidManifest.xml')
assembled=test/'assembled.apk'
with zipfile.ZipFile(unsigned) as source,zipfile.ZipFile(assembled,'w',zipfile.ZIP_DEFLATED) as z:
 for entry in source.infolist():z.writestr(entry.filename,source.read(entry.filename),compress_type=entry.compress_type)
 z.write(dex/'classes.dex','classes.dex')
aligned=test/'aligned.apk';run(paths['zipalign'],'-f','4',assembled,aligned)
run(paths['java'],'-jar',paths['apksignerJar'],'sign','--ks',BUILD/'signing/bangladesh-affairs.jks','--ks-key-alias','bangladesh-affairs','--ks-pass','file:'+str(BUILD/'signing/password.txt'),'--v1-signing-enabled','false','--v2-signing-enabled','true','--v3-signing-enabled','true','--v4-signing-enabled','false','--out',test/'tests.apk',aligned)
print('Temporary Android instrumentation built.')
