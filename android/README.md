# Standalone Android package

`dist/Bangladesh-Affairs.apk` is the only installation file. Android 8.0 or newer is required. It uses the device's Android WebView, includes the map, facts, history, fonts and both supplied images, and needs no website or internet permission. Reference links can open separately in a browser. The website's install dialog, service worker, deployment code, network data loader, unused D3 functions and development tools are excluded from the APK.

All seven map datasets and study content are embedded in one minified script. HTML, two stylesheets, the Bengali font, images, and required licence files are the remaining packaged assets. Source files are transformed for Android during packaging; the website source stays intact.

The Android layout removes promotional hero blocks, enlarges touch controls, brings the map onto the initial phone screen, and puts map/detail panels alongside each other on tablets. Rotation preserves the current view and history stop. Responsive checks cover phone portrait/landscape and tablet portrait/landscape; native tests use phone and large-tablet logical screen sizes.

Version 1.1 uses one-finger swipes to scroll the page, including over the map. Map pan and pinch require two fingers; lifting either finger stops map movement. A single tap still selects a district. `qa/two-finger.cjs` verifies the Android and Pages assets with real Chrome touch input in phone and tablet orientations.

Version 1.2 expands the places dataset to 42 locations: 32 historic/important places and the existing 10 nature anchors. It adds mosque and park/garden filters, Bengali and spelling-alias searches, and district-shaped border selection/focus without a rectangular outline. `qa/heritage.cjs` checks marker/directory parity, source links, district-coordinate associations, responsive layouts and keyboard focus in both packaged builds.

Tapping overlapping historic-place pins opens a Nearby places list, so close Dhaka landmarks remain selectable without shifting their geographic positions.

For a Windows rebuild, run `bootstrap_tools.py`, install build-only `esbuild@0.28.2` and `d3@7.9.0` under `.android-build/js-tools`, then run `build_apk.py` with Python. The scripts use portable verified tools and do not install system software. Build and test tooling is ignored by Git and excluded from `dist/`.

Keep `.android-build/signing/bangladesh-affairs.jks` and its password file private and backed up if you want future APKs to update the installed app. They are not inside the APK or repository. The isolated CI verification generates its own temporary signing key and tests the same app source with native Android instrumentation. The local APK's v2/v3 signatures and alignment are checked independently.

`verify_web.cjs` tests the exact packaged assets without the website. `OfflineTests.java` tests a native WebView launch, content, save/reload, Android Back, and two-finger pinch with networking disabled. The test APK and emulator are never part of the delivered APK.
