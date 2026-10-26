import fs from 'node:fs';
import {findFFmpeg,command} from '../../dist/src/media.js';
const s=JSON.parse(fs.readFileSync('productions/la-novia-del-vampiro/.studio/state.json','utf8'));
const ff=await findFFmpeg(s.config);
const p='productions/la-novia-del-vampiro/media/higgsfield/EP001-REBUILD-C02-v1.mp4';
for(const t of [0.5,2.5,4.5]) await command(ff,['-y','-hide_banner','-loglevel','error','-ss',String(t),'-i',p,'-frames:v','1','-q:v','3','tmp/pdfs/c02-'+t+'.jpg']);
console.log(ff);
