import {FACTS,TIMELINE,SOURCES} from '../assets/content.js';
import {writeFileSync} from 'node:fs';
const resolve=s=>SOURCES[s]?.url??s;
writeFileSync(new URL('./content-references.json',import.meta.url),JSON.stringify([...FACTS,...TIMELINE].map(r=>({name:r.title,source:resolve(r.source)})),null,2));
