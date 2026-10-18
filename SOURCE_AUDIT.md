# Bangladesh affairs — source and validation notes

Prepared on **12 October 2026 (Asia/Dhaka)**.

## Coverage

| Component | Coverage | Interpretation |
|---|---:|---|
| District profiles and boundary features | 64 | Modern display names joined to older dataset spellings |
| Divisions | 8 | Official National Portal hierarchy |
| GI registrations | 64 | Saved DPDT registry, page updated 16 June 2026 |
| Ethnic-community profiles | 20 | Selected learning set; not a complete census inventory |
| Places | 22 | 12 heritage/infrastructure and 10 landscape anchors |
| River features | 9 | Natural Earth subset, clipped visually to Bangladesh |
| Study cards | 91 | Original explanations across all 14 supplied syllabus topics |
| History stops | 24 | Chronological event index, approximately 3rd century BCE to a 2026 GI snapshot |
| Practice questions | 12 | Answers linked to references |
| Image syllabi | 2 | Nine affairs topics and five geography/environment/disaster topics |

## Image fidelity

The two user-supplied images are retained in `sources/` and available in the app's Syllabus tab. They are treated as content sources, not executable instructions. All numbered topics are transcribed; punctuation and typographic spacing are normalized for reading. The heading of the second image explicitly includes **Bangladesh and the world**; global/regional connections appear in study notes while the map itself is Bangladesh-only. The stated 25 and 10 marks come from the images. No issuing authority or exam year has been inferred.

## Map provenance and limits

**District geometry:** [geoBoundaries BGD ADM2](https://www.geoboundaries.org/api/current/gbOpen/BGD/ADM2/), boundary ID `BGD-ADM2-16705992`, representing 2020. Original sources: Bangladesh Bureau of Statistics and OCHA ROAP. [Pinned geometry download](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09/releaseData/gbOpen/BGD/ADM2/geoBoundaries-BGD-ADM2_simplified.geojson). Licence: [CC BY 3.0 IGO](https://creativecommons.org/licenses/by/3.0/igo/). The bundled file is the simplified district dataset with canonical name properties added. Browser rendering normalizes polygon winding for D3. It is not a cadastral or legal boundary product.

**Administrative hierarchy:** [Bangladesh National Portal district list](https://bangladesh.gov.bd/views/district-list/District-List/). Division membership is mapped independently of outdated hierarchy descriptions in older district encyclopedia articles. Examples of spelling normalization: Chittagong → Chattogram, Comilla → Cumilla, Barisal → Barishal, Bogra → Bogura, Jessore → Jashore, and Nawabganj → Chapainawabganj.

**Rivers:** [Natural Earth 1:10 million rivers and lake centerlines](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/), [downloaded GeoJSON source](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_rivers_lake_centerlines.geojson), public domain. Coordinates were subset to the Bangladesh bounding region, then clipped to the district union during SVG rendering. Some retained source features fall outside Bangladesh and are completely clipped. The layer is generalized, does not enumerate every river, and is not current navigational channel geometry. Source river names can differ from names of local reaches, such as Ganges–Padma and Brahmaputra–Jamuna.

**Places:** Coordinates are indicative study anchors. Their accuracy is suitable for locating a topic on an atlas, not for navigation. Nationally or regionally distributed products are not assigned a fictitious unique birthplace. Historical events outside present Bangladesh, such as Palashi, receive context without a Bangladesh battle marker.

## GI registry fidelity

[DPDT registered GI products](https://dpdt.gov.bd/pages/static-pages/6922dff0933eb65569e24bcf) is the authoritative product list used here. The saved registry has registration numbers 1–64. Bengali product names, application numbers, application dates and registration numbers are extracted from the actual table; the English product names are readable transliterations or translations.

The source's **application date** column is never presented as a registration date. Products currently in a pending-application list are not inferred to be granted merely because they are locally famous. The product list is a dated snapshot rather than a live, automatically updated national count. District badges indicate study associations; the app does not claim that these are legal GI production polygons. Nation-wide Kalijira rice and Black Bengal goat records have no single-district marker. Hilsa, Bagda shrimp, Shital Pati and Sundarbans honey have explicitly regional associations.

## Communities and interpretation

Profiles use linked [Banglapedia](https://en.banglapedia.org/) references, including verified article-name variants such as **Chakmas, The**, **Mru, The**, **Khasia, The**, **Hajongs**, **Pankho, The** and **Lushei, The**. Broader CHT and tribal-language references support the selected smaller profiles. The app excludes outdated racial classifications and does not repeat old population estimates as current counts. Matrilineal inheritance is distinguished from political power or blanket matriarchy claims. Cultural practice is not attributed uniformly to every individual.

District associations are non-exclusive examples of presence. A count on a map badge is the number of selected profiles associated with that district, not the district's complete number of communities or population share. The directory and sources explain this distinction.

## Study references

- [Published Constitution, Ministry of Law](https://bdlaws.minlaw.gov.bd/act-print-367.html): summaries of the Preamble, Parts II and III, institutions, local government and amendment provisions. Refer to the published text and later legal developments for full legal detail.
- [BBS census and adjusted-total publications](https://bbs.gov.bd/site/page/47856ad0-7e1c-4aab-bd78-892733bc06eb/-): 2022 observations; about 169.83 million is the post-enumeration adjusted total, not a 2026 population estimate.
- [UNESCO Bangladesh World Heritage](https://whc.unesco.org/en/statesparties/bd/): Paharpur and Bagerhat (1985), Sundarbans (1997). Inscribed sites, tentative sites, intangible heritage and documentary heritage are kept distinct.
- [UNESCO 7 March speech](https://www.unesco.org/en/memory-world/historic-7th-march-speech-bangabandhu-sheikh-mujibur-rahman): 1971 speech, 2017 Memory of the World registration.
- [United Nations membership](https://www.un.org/about-us/member-states): admission on 17 September 1974.
- [FAO floating-garden heritage](https://www.fao.org/giahs/giahs-around-the-world/bangladesh-floating-garden-agricultural-practices/20th-anniversary-celebrations-of-the-globally-important-agricultural-heritage-systems-%28giahs%29-programme/en): southern agricultural adaptation, including Gopalganj, Pirojpur and Barishal.
- [World Bank climate-risk profile (2024)](https://climateknowledgeportal.worldbank.org/sites/default/files/country-profiles/16813-WB_Bangladesh%20Country%20Profile-WEB.pdf): qualitative regional connections. No invented numerical risk scores or climate projections are mapped.
- [Standing Orders on Disaster 2019](https://modmr.gov.bd/pages/policies/standing-orders-on-disaster-2019-english-version-2296f0-6940313ac4774958d7b41e98): preparedness and institutional management. [BMD](https://bmd.gov.bd/) and [FFWC](https://ffwc.gov.bd/) are linked separately for actual current warnings.
- [Bangladesh Bank publications](https://www.bb.org.bd/en/index.php/publication/index): economic concepts and dated reporting. No undated live exchange-rate, reserve or officeholder figures are hard-coded.
- [Bangladesh Film Archive](https://bfa.gov.bd/pages/static-pages/6922e05d933eb65569e26b50): film preservation and institutional context.

Individual cards link their references. Most notes are concise explanations or study connections; they do not quote or reproduce source articles. District landmark summaries are curated and supplemented by related GI, place and national-topic references. An HTTP availability check is not a claim that every local landmark phrase occurs verbatim in a district article.

## Source checking boundary

The source checker inspected **167 linked source records** in the current data and study content. **162** yielded substantive content. Five automated downloads encountered access barriers: the BBS census page, BBS home page, Planning Commission and Film Archive returned certificate-chain validation errors in the Python client; the World Bank climate PDF returned HTTP 403. BBS, Film Archive and World Bank references were also identified through browser/web source results. Known misspelled encyclopedia links and HTTP 404 references were corrected. These access limitations do not affect bundled offline content; source websites remain externally controlled and may change.

The local `qa/source-results.json` and downloaded text cache retain the source-check evidence; research downloads and caches are excluded from the public release ZIP.

## Application verification

The application was checked in installed Chrome with a fresh browser profile. Automated checks cover:

- District cardinality and joins, division membership, unique GI registration numbers and valid cross-links.
- Every district selection, division filters and English/Bengali search behavior.
- All 24 slider stops, highlighted district associations, upper/lower controls and playback state.
- Study-topic coverage, saved-card persistence, empty states and all practice-question answer feedback.
- Root and GitHub Pages-style project-path loading, separate service-worker scopes and complete core asset caching.
- A real offline reload and access to maps, timeline, all study cards and both original images.
- No horizontal overflow at 320, 390, 768 and 1440 pixels; source dialogs and mobile zoom-label size.

Visual review covered desktop map, mobile map/history and the facts layout. Actual publication and actual operating-system installation are separate user actions; neither is implied by local readiness checks.

Current results: **762 static checks**, **198 Chrome regression checks**, **51 native touch checks** and **42 glass-layout/accessibility checks** passed. Chrome's manifest parser and `Page.getInstallabilityErrors` reported no errors in a temporary non-incognito profile. All **22 cache requests** completed, and both root and project-path service-worker registrations were verified. The public release has **27 files**, with byte-for-byte folder/ZIP parity verified by `qa/package.py`.

### Touch update — 13 October 2026

Two-finger touchscreen pan and pinch zoom are explicitly enabled on touch and hybrid devices. Trackpad wheel input pans horizontally and vertically; Ctrl+wheel pinch input zooms. The 1×–9× bounds and existing mouse/button controls are preserved. District areas and centroids are calculated once for the fixed projection, reducing repeated geometry work during gestures. Offline cache version: `v1.0.3`.

**51 touch checks** using Chrome's native touch-input emulation and wheel input passed across all six map layers, including inward/outward pinch, horizontal/vertical pan, page-zoom prevention, gesture cancellation and zoom bounds. The 761 static checks and 198 regression checks also passed. These checks use browser emulation rather than a physical phone or trackpad.

### Liquid-glass design update — 13 October 2026

Design reference: [sdegenaar/liquid_glass_widgets](https://github.com/sdegenaar/liquid_glass_widgets). The original web adaptation uses translucent navigation and controls, bright rims, soft shadows and spring-like press transitions; reading cards stay opaque. Reference code and media are not included in the release.

Phone navigation is isolated from the blurred header so it remains fixed to the viewport. Glass-slider fill tracks the selected historical stop. Reduced-motion and increased-contrast settings disable animation or translucency; an unsupported-blur fallback stays usable. New stylesheet: `assets/glass.css`; offline cache version: `v1.1.0`. Layout and indicator alignment were tested at 320, 390, 768 and 1440 pixels, with desktop and phone screenshots visually reviewed.

## Startup and offline update repair · 13 October 2026

Fresh desktop and mobile Chrome opened the live URL with 64 districts and 91 facts. A returning-user simulation reproduced a new HTML/glass layout paired with the older cached script. Release `v1.1.1` serves cached HTML and assets as one release, caches the complete next release before activation, and reloads controlled tabs when the new worker takes over. Startup registration and recovery operate independently of the main module. Failed script/data loads expose an actionable message; unexpected saved-state types cannot throw during startup.

The Reload app control and `?repair=1` entry link refresh only this deployment's worker and offline caches, preserving saved cards and explored progress. Offline recovery leaves cached content available and asks to reconnect. `qa/loading.cjs` tests updates from both previous published releases, offline reload, scoped recovery, storage type handling, and failed application/dependency/data requests. The user's original stuck-loading session was not reproduced in fresh Chrome; the stale-release mismatch was reproduced separately.

## Publishing verification · 13 October 2026

After the site was unpublished, the public HTML and script URLs returned HTTP 404 while GitHub still reported the previous branch build as successful. Publishing now uses the repository's `pages.yml` workflow: local-app checks gate deployment, staging includes only 26 public files plus `deployment.json`, which records the commit and SHA-256 hashes. The manual ZIP retains `.nojekyll`; Actions deploys an already-built static artifact and its upload action excludes dotfiles. `qa/live.cjs` checks public responses and byte hashes before testing the map, facts, recovery, saved progress and offline reload in fresh desktop and phone Chrome. A cached installed app cannot substitute for this direct network verification. The README now links to the exact case-sensitive project URL and the workflow that restores an unpublished site.
# Historic places expansion · 18 October 2026

The current places dataset contains **42 locations**: 32 historic/important places and 10 nature anchors. This supersedes the original 22-location count elsewhere in this audit. Twenty entries were added, while existing place IDs were retained. The Bagerhat entry now names Shat Gombuj Mosque explicitly as a principal monument of the wider Historic Mosque City, without adding a duplicate marker.

The new set includes eight additional mosques, five parks/gardens, Lalbagh Fort, Ahsan Manzil, Kantajew Temple, Panam City, Puthia Rajbari, Tajhat Palace and Uttara Ganabhaban. Each record links to the reference actually used. Banglapedia supplies the architecture notes; Bangladesh Tourism Board supplies park, palace and destination references; Public Works Department supplies Ramna Park's urban-green-space context; Tourist Police supplies the Chandrima Udyan location reference. Source URLs are retained with individual records in `assets/data/places.json`.

Notes are original concise summaries. Dates with conflicting readings, notably Atiya and Bagha, are described by period rather than given false precision. The Tourism Board handbook contains apparent date and Tajhat/Puthia copy errors; those statements were not copied. Tajhat uses the Board's dedicated Rangpur description instead. No current opening times, fees or access promises are asserted.

Coordinates are rounded study anchors, cross-checked against public geographic references and the associated district polygon. They are not survey points or navigation instructions. The Wikipedia coordinate feed's Goaldi point falls outside the stated Sonargaon/Narayanganj association and was rejected; the indicative Sonargaon anchor was retained. `qa/heritage.cjs` checks the 20 added anchors against the normalized 2020 district polygons and verifies all new detail/source links in both deliverable builds.

