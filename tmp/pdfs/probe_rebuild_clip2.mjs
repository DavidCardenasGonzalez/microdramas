import fs from 'node:fs';
import {probe,findFFmpeg,command} from '../../dist/src/media.js';
const s=JSON.parse(fs.readFileSync('productions/la-novia-del-vampiro/.studio/state.json','utf8'));
const ff=await findFFmpeg(s.config);
const file='productions/la-novia-del-vampiro/media/higgsfield/EP001-REBUILD-C02-v1.mp4';
console.log(await probe(file,s.config));
await command(ff,['-hide_banner','-v','error','-i',file,'-f','null','-']);
console.log('full decode pass');
