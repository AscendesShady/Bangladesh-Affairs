// Publish the package's public files; Actions serves static artifacts without Jekyll.
import {cpSync,copyFileSync,mkdirSync,readFileSync,readdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url)),target=path.join(root,'_site');
// Refuse a stale staging folder instead of carrying old files into the deployment.
mkdirSync(target);
// The official Pages upload action excludes dotfiles. .nojekyll belongs to the
// manual branch/ZIP package, and is unnecessary for an Actions deployment.
const top=['index.html','sw.js','manifest.webmanifest','README.md','SOURCE_AUDIT.md','LICENSE','serve.cjs'];
for(const file of top)copyFileSync(path.join(root,file),path.join(target,file));
cpSync(path.join(root,'assets'),path.join(target,'assets'),{recursive:true});
mkdirSync(path.join(target,'sources'));
for(const file of ['bangladesh-affairs-syllabus.png','geography-environment-syllabus.png'])copyFileSync(path.join(root,'sources',file),path.join(target,'sources',file));
function files(dir,prefix=''){
 return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name),prefix+entry.name+'/'):[prefix+entry.name]);
}
const html=readFileSync(path.join(target,'index.html'),'utf8'),worker=readFileSync(path.join(target,'sw.js'),'utf8');
const release=html.match(/data-release="([^"]+)"/)[1];
assert.equal(worker.match(/const VERSION='v([^']+)'/)[1],release,'HTML and worker release must match');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=Object.fromEntries(files(target).map(file=>[file,hash(readFileSync(path.join(target,file)))]));
writeFileSync(path.join(target,'deployment.json'),JSON.stringify({commit:process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),release,files:hashes},null,2));
console.log(`Staged ${Object.keys(hashes).length} public files and deployment manifest for release ${release}.`);
