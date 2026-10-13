# Bangladesh affairs

A buildless HTML, CSS and JavaScript study atlas, ready for GitHub Pages. The app includes:

- All 64 district boundaries and profiles, grouped into eight divisions.
- Searchable DPDT GI registry snapshot: 64 registrations, with Bengali names and registration numbers.
- 20 selected ethnic-community profiles and broad district associations.
- 22 heritage, infrastructure and landscape places; a major-river overlay.
- A 24-stop history slider, previous/next controls and optional playback.
- 91 source-linked study cards across the 14 topics in the two supplied syllabus images.
- Bengali topic titles and recall cues, saved cards, explored-district progress and 12 practice questions.
- Offline PWA caching, local Bengali font, installable Chrome manifest and responsive layouts.
- Liquid-glass navigation, frosted controls, a floating phone dock and opaque study cards for clear reading.

## Preview locally

From this folder, run:

```powershell
node serve.cjs
```

Open `http://127.0.0.1:8847/bangladesh-affairs/` in Chrome. To choose another port:

```powershell
$env:PORT = '8848'
node serve.cjs
```

Opening `index.html` directly as a `file://` page will not enable data fetching or PWA caching. Use the local server or HTTPS hosting.

## Publish to GitHub Pages

1. Extract `bangladesh-affairs-github-pages.zip` and upload its **contents** to a GitHub repository. `index.html`, `sw.js` and `manifest.webmanifest` must be at the repository root, alongside `assets/` and `sources/`.
2. Commit the files to the repository's main branch.
3. Under **Settings → Pages**, select **Deploy from a branch**, choose that branch and **/(root)**, then save.
4. Open the HTTPS Pages URL after deployment completes. A project URL such as `https://YOUR-NAME.github.io/bangladesh-affairs/` works without changing asset paths.

No build command, npm install, API key, CDN connection or paid service is required. `.nojekyll` is included. Source repository: [AscendesShady/Bangladesh-Affairs](https://github.com/AscendesShady/Bangladesh-Affairs).

## Install and use offline

Open the HTTPS app in Chrome and wait for **Offline ready** in the footer. Use **Install app**, Chrome's address-bar install control, or its installation menu. On Android, the menu may show **Install app** or **Add to Home screen**. Browser/version-specific instructions also appear inside the app.

The map, districts, GI list, community profiles, history, facts, font and original syllabus images are cached after the first complete load. External source links and official live-warning websites need an internet connection. Actual OS installation is performed by the user through Chrome.

## Explore

- Select a district polygon, search the directory, or filter by division.
- Change map layers to explore GI products, communities, places or nature.
- On touchscreens, move two fingers together to pan and spread or pinch them to zoom. One-finger dragging also pans the map; scroll the page outside the map.
- On a trackpad, scroll with two fingers to pan horizontally or vertically; pinch to zoom. Mouse dragging and the + / − buttons remain available, with Ctrl + wheel for zoom.
- Labels retain a consistent screen size. **District names** reveals a collision-aware subset; zoom to see more.
- **Time history** steps through events. Dates are chronological, but event spacing is not proportional to elapsed years. The base map always uses modern districts.
- Save study cards with the heart. All saved cards and explored progress stay in this browser; there is no sign-in or server-side storage.
- **Syllabus** contains the transcribed text and both original images, with links to the corresponding study topics.

## Content and sources

See [SOURCE_AUDIT.md](SOURCE_AUDIT.md) and the app's **Sources & about** dialog. GI data is a snapshot of the DPDT page updated **16 June 2026**, checked on **12 October 2026**. Application dates are explicitly distinguished from registration dates. GI map locations are study associations, not legal production-area boundaries.

Community coverage is a selected learning set, not all communities recorded by the census. Associations are non-exclusive and do not represent exact settlement polygons. Nature/hazard notes are qualitative educational explanations; this is not a live forecasting service. History markers are event or heritage associations on 2020 district outlines, not reconstructions of historic political boundaries.

The images supply nine Bangladesh affairs topics (25 marks) and five geography/environment/disaster topics (10 marks). Their exam year and issuing authority are not supplied; the app does not claim that these images establish a current official exam syllabus. Study cards explain the topics and are not a full textbook.

## Edit or maintain

- `assets/content.js`: topic transcriptions, fact cards, timeline and practice questions.
- `assets/data/*.json`: district profiles, GI products, communities, places and provenance.
- `assets/data/districts.geojson`: district geometry; `rivers.geojson`: generalized major waterways.
- `assets/app.js` / `assets/style.css`: interactions and appearance.
- `assets/glass.css`: glass surfaces, pill navigation, slider styling and reduced-motion/contrast fallbacks.
- `manifest.webmanifest`: app identity and installation metadata.
- `sw.js`: offline core file list and version.

When runtime content changes, increment `VERSION` in `sw.js` and `data-release` in `index.html`, keep the core file list complete, and deploy the changed files together. The worker caches a complete release before activating; controlled tabs reload once on an update. Navigation uses that release's cached HTML so it matches the scripts. Cache names are scoped to the deployment URL so other Pages apps on the same host retain their own caches.

If a browser stays on Loading, use **Reload app** while online, or open [the recovery link](https://ascendesshady.github.io/Bangladesh-Affairs/?repair=1). Recovery refreshes only this app's offline cache and worker; saved cards, explored progress and other apps' caches are retained. Startup failures expose a recovery message even if the main script fails.

Maintainer checks in the working checkout:

```powershell
node qa/validate.mjs
node qa/browser.cjs
node qa/touch.cjs
node qa/glass.cjs
node qa/loading.cjs
```

The browser checker uses the bundled Codex Playwright runtime and installed Chrome; change its `require` path if running elsewhere. It starts an isolated temporary server and closes it after testing. `qa/build_data.py` uses Python, lxml and Pillow and requires the locally saved DPDT HTML snapshot; those research downloads are excluded from the public ZIP. The public app uses only its bundled runtime files.

## Licences

The visual design is inspired by [sdegenaar/liquid_glass_widgets](https://github.com/sdegenaar/liquid_glass_widgets). This is an original web adaptation of its navigation-and-controls approach, using CSS blur, rim highlights and press transitions. The Flutter library, native refraction shaders and reference screenshots are not bundled.

- Original application code and icon artwork: MIT, see `LICENSE`.
- District boundaries: BBS / OCHA ROAP via geoBoundaries, **CC BY 3.0 IGO**. Attribution and source URLs are preserved in the app and source notes.
- River geometry: Natural Earth, public domain; simplified atlas-scale representation.
- D3 v7.9.0: ISC; `assets/vendor/d3-LICENSE.txt`.
- Noto Sans Bengali: SIL Open Font License 1.1; `assets/fonts/OFL.txt`.
- Original syllabus images remain user-supplied materials. The MIT code licence does not relicense third-party data, fonts or supplied images.
