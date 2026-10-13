"""Install and test only on the isolated emulator created for this task."""
from pathlib import Path
import json, subprocess, time
ROOT=Path(__file__).resolve().parents[1];BUILD=ROOT/'.android-build';info=json.loads((BUILD/'emulator-process.json').read_text());adb=info['adb'];serial=info['serial']
assert serial=='emulator-5580','Unexpected target device'
def command(*args,timeout=120,check=True):
 result=subprocess.run([adb,'-s',serial,*map(str,args)],capture_output=True,text=True,timeout=timeout)
 if check and result.returncode:raise RuntimeError(result.stdout+result.stderr)
 return result.stdout.strip()
start=time.monotonic();last=-1
while time.monotonic()-start<600:
 elapsed=int(time.monotonic()-start)
 if elapsed//30!=last:last=elapsed//30;print('Waiting for isolated Android boot: '+str(elapsed)+' seconds',flush=True)
 try:
  if command('shell','getprop','sys.boot_completed',timeout=15,check=False)=='1':break
 except subprocess.TimeoutExpired:pass
 time.sleep(3)
else:raise RuntimeError('Android software emulator did not boot within ten minutes')
print('Android booted. Installing the signed offline APK.',flush=True)
print(command('install','-r',ROOT/'dist/Bangladesh-Affairs.apk'),flush=True)
print(command('install','-r',BUILD/'native-tests/tests.apk'),flush=True)
command('shell','svc','wifi','disable',check=False);command('shell','svc','data','disable',check=False)
command('logcat','-c')
print('Testing APK in Android with Wi-Fi and mobile data disabled.',flush=True)
result=command('shell','am','instrument','-w','bd.affairs.offline.tests/bd.affairs.offline.tests.OfflineTests',timeout=300)
(BUILD/'native-test-output.txt').write_text(result)
print(result,flush=True)
logs=command('logcat','-d','-s','BangladeshAffairs:E','BangladeshAffairsQA:I')
(BUILD/'native-test-log.txt').write_text(logs)
assert 'INSTRUMENTATION_CODE: -1' in result and 'native Android checks passed' in result,logs
errors=[line for line in logs.splitlines() if ' E BangladeshAffairs:' in line]
assert not errors,'Native JavaScript errors: '+str(errors)
command('shell','am','force-stop','bd.affairs.offline')
command('shell','am','start','-n','bd.affairs.offline/.MainActivity')
time.sleep(3)
image=subprocess.run([adb,'-s',serial,'exec-out','screencap','-p'],capture_output=True,check=True).stdout
(BUILD/'android-offline-preview.png').write_bytes(image)
(BUILD/'native-results.json').write_text(json.dumps({'offline':True,'installedReleaseApk':str(ROOT/'dist/Bangladesh-Affairs.apk'),'instrumentation':result,'consoleErrors':errors,'coldRestartPerformed':True},indent=2))
print('Native offline Android verification completed.',flush=True)
