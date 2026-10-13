# Reproduce Bangladesh affairs

This folder contains the editable HTML/CSS/JavaScript, original datasets and syllabus images, Android wrapper, build scripts, required portable Windows build tools, dependency packages, signing key, research notes, and validation evidence. The private signing material is inside `.android-build/signing/`; keep this folder private. Only the sibling `GitHub-Pages` folder is intended for a public repository.

From PowerShell, run `./rebuild.ps1`. The included Node, Python, JDK, Android build tools and platform JAR build the APK without a global tool installation or a website. When this folder is named `Reproduce`, rebuilding writes `../Bangladesh-Affairs.apk` and regenerates `../GitHub-Pages/`. Android source is under `android/`; app content is under `assets/`. For SDK refreshes or native emulator tests, the optional scripts may need internet access. Ordinary rebuilding uses the supplied local tools and data.

The APK requires Android 8.0 or newer and the device's standard Android WebView. It has no internet, location or shared-storage permission. Study content, images and fonts are inside the APK; reference websites open separately in a browser. Phone and large-tablet layouts are tested in both orientations, and rotation preserves the current view and history stop.

The original browser source and prior generated packages are preserved here for history. The public folder is a separate, smaller distribution with bundled data and a self-contained Pages workflow. Native build outputs and test resources are not included in the installable APK.
