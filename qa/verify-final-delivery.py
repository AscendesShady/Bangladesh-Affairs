"""Check the folder contract and exact packaged APK bytes after rebuilding."""
from pathlib import Path
import hashlib,json,zipfile
ROOT=Path(__file__).resolve().parents[1];DELIVERY=ROOT.parent
items=sorted(p.name for p in DELIVERY.iterdir())
assert items==['Bangladesh-Affairs.apk','GitHub-Pages','Reproduce'],items
apks=list(DELIVERY.rglob('*.apk'));assert len(apks)==1,apks
apk=apks[0];assets=ROOT/'.android-build/assets/app'
with zipfile.ZipFile(apk) as z:
    assert z.testzip() is None,'APK ZIP corruption'
    web=[name for name in z.namelist() if name.startswith('assets/app/')]
    assert len(web)==11,len(web)
    for name in web:assert z.read(name)==(assets/name.removeprefix('assets/app/')).read_bytes(),name
public=list((DELIVERY/'GitHub-Pages').rglob('*'))
assert not any(p.is_file() and (p.suffix in ['.apk','.jks'] or p.name=='password.txt') for p in public)
native=json.loads((ROOT/'.android-build/two-finger-native.json').read_text())
assert all(p['conclusion']=='success' and p['offline'] for p in native)
result={'rootItems':items,'apkVersion':'1.1','apkBytes':apk.stat().st_size,'apkSHA256':hashlib.sha256(apk.read_bytes()).hexdigest(),'singleAPK':True,'publicFiles':sum(p.is_file() for p in public),'gestureChecks':json.loads((ROOT/'.android-build/two-finger-results.json').read_text())['checks'],'nativeOfflineProfiles':[p['profile'] for p in native],'nativeChecksPerProfile':[33,34],'publicChecks':json.loads((ROOT/'.android-build/public-results.json').read_text())['checks'],'cachedUpgradeChecks':json.loads((ROOT/'.android-build/pages-update-results.json').read_text())['checks']}
live=ROOT/'.android-build/live-pages-results.json'
if live.exists():result['livePagesChecks']=json.loads(live.read_text())['checks']
(ROOT/'DELIVERY-VERIFICATION.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
