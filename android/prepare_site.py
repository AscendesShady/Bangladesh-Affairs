"""Finish the public-only GitHub Pages package; never copy build keys or tools."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT.parent/'GitHub-Pages' if ROOT.name=='Reproduce' else ROOT/'GitHub-Pages'
workflow=SITE/'.github/workflows';workflow.mkdir(parents=True,exist_ok=True)
(workflow/'pages.yml').write_text('''name: Publish Bangladesh affairs
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v7
      - uses: actions/configure-pages@v5
      - name: Validate self-contained public assets
        run: |
          node --check assets/offline.js
          node -e "const fs=require('fs');const s=fs.readFileSync('sw.js','utf8');const files=JSON.parse(s.match(/const CORE=(\\[[\\s\\S]*?\\]);/)[1]);for(const f of files)if(f!=='./'&&!fs.existsSync(f))throw new Error('Missing '+f);console.log(files.length+' offline entries verified');"
      - uses: actions/upload-pages-artifact@v4
        with:
          path: .
      - id: deployment
        uses: actions/deploy-pages@v4
''',encoding='utf-8')
(SITE/'README.md').write_text('''# Bangladesh affairs · GitHub Pages

Push **all contents of this folder** to the repository root on `main`, including `.github/`. In GitHub **Settings → Pages**, select **GitHub Actions**. `index.html` must remain beside `assets/`, `sources/`, `manifest.webmanifest` and `sw.js`; do not upload this folder as a nested directory.

The app includes 64 districts, 64 GI records, 20 community profiles, 42 places, 91 facts, 14 syllabus topics and 24 history stops. Map data and study content are embedded in one local script; there are no separate JSON downloads or remote runtime libraries. Chrome installation and offline caching remain supported. Touch controls and layouts adapt to phones and large tablets, including portrait and landscape.

Use HTTPS hosting or a local HTTP server to preview the web app. The standalone Android installer is a separate APK and runs without this site.

Source notes: `SOURCE_AUDIT.md`. Licence: `LICENSE`, `assets/vendor/d3-LICENSE.txt`, `assets/fonts/OFL.txt`. No Android signing keys, native build tooling, test APKs, or research downloads are present in this public folder.
''',encoding='utf-8')
(SITE/'SOURCE_AUDIT.md').write_text((ROOT/'SOURCE_AUDIT.md').read_text(encoding='utf-8')+'\n\n## Self-contained distribution · 18 October 2026\n\nThis distribution embeds all six used map datasets and the original provenance metadata in its JavaScript bundle. It retains the original educational content and citations, uses a classic script instead of module imports, and precaches the complete shell as release v1.3.0. Promotional hero blocks are removed; touch controls are enlarged and tablet map/details panels share the available width.\n',encoding='utf-8')
css=SITE/'assets/glass.css'
css.write_text(css.read_text(encoding='utf-8')+'''
/* Web-only installation controls; the APK does not include these. */
#connection { display: none; }
@media(max-width:1100px) and (min-width:701px) {
 .app-header { display:flex; flex-wrap:wrap; }
 .brand { flex:1; }
 .tabs { order:3; flex:0 0 100%; width:100%; }
 .header-actions { order:0; margin-left:auto; }
}
@media(max-width:700px) {
 .install { font-size:11px; padding:7px; }
 .brand { min-width:0; }
}
@media(max-width:360px) {
 .app-header { padding:6px; gap:5px; }
 .brand { gap:4px; }
 .brand img { width:26px; height:26px; }
 .brand h1 { font-size:14px; }
 .install { font-size:10px; padding:6px; }
 .header-actions { gap:4px; }
 .header-actions .icon-btn { width:44px; min-height:44px; }
}
''',encoding='utf-8')
print('Public GitHub Pages folder ready.')
