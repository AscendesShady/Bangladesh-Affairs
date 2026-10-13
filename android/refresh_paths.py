"""Refresh local portable tool paths without downloading or installing anything."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];TOOLS=ROOT/'.android-build/tools'
paths={'java':next((TOOLS/'jdk').rglob('java.exe')),'javac':next((TOOLS/'jdk').rglob('javac.exe')),'keytool':next((TOOLS/'jdk').rglob('keytool.exe')),'node':TOOLS/'node/node.exe','androidJar':next((TOOLS/'platform').rglob('android.jar')),'aapt2':next((TOOLS/'build-tools').rglob('aapt2.exe')),'zipalign':next((TOOLS/'build-tools').rglob('zipalign.exe')),'d8Jar':next((TOOLS/'build-tools').rglob('d8.jar')),'apksignerJar':next((TOOLS/'build-tools').rglob('apksigner.jar'))}
assert all(p.is_file() for p in paths.values())
(TOOLS/'paths.json').write_text(json.dumps({k:p.relative_to(ROOT).as_posix() for k,p in paths.items()},indent=2))
print('Portable build paths refreshed.')
