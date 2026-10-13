"""Use the Android SDK and Java already provided by the Linux build runner."""
from pathlib import Path
import json, os, shutil
ROOT=Path(__file__).resolve().parents[1];BUILD=ROOT/'.android-build';(BUILD/'tools').mkdir(parents=True,exist_ok=True)
sdk=Path(os.environ.get('ANDROID_HOME') or os.environ['ANDROID_SDK_ROOT']);tools=sdk/'build-tools/36.0.0'
paths={name:shutil.which(name) for name in ['java','javac','keytool']}
paths.update(androidJar=str(sdk/'platforms/android-36/android.jar'),aapt2=str(tools/'aapt2'),zipalign=str(tools/'zipalign'),d8Jar=str(tools/'lib/d8.jar'),apksignerJar=str(tools/'lib/apksigner.jar'))
assert all(value and Path(value).exists() for value in paths.values()),'Missing build tool'
(BUILD/'tools/paths.json').write_text(json.dumps(paths,indent=2))
(BUILD/'emulator-process.json').write_text(json.dumps({'serial':'emulator-5580','adb':str(sdk/'platform-tools/adb')}))
print('Linux Android build paths configured.')
