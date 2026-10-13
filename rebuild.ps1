$ErrorActionPreference='Stop'
$reproductionRoot=$PSScriptRoot
$portablePython=Join-Path $reproductionRoot '.android-build/tools/python/python.exe'
$portableNode=Join-Path $reproductionRoot '.android-build/tools/node/node.exe'
Push-Location -LiteralPath $reproductionRoot
try {
    & $portablePython android/refresh_paths.py
    if($LASTEXITCODE){throw 'Tool path setup failed'}
    & $portablePython android/build_apk.py
    if($LASTEXITCODE){throw 'APK build failed'}
    & $portableNode android/package_assets.cjs --web
    if($LASTEXITCODE){throw 'Web bundle build failed'}
    & $portablePython android/prepare_site.py
    if($LASTEXITCODE){throw 'Site packaging failed'}
    Write-Output 'The APK and GitHub-Pages folder were rebuilt.'
} finally { Pop-Location }
