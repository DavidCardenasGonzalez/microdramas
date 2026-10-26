import fs from 'node:fs';
import {findFFmpeg,command} from '../../dist/src/media.js';
const s=JSON.parse(fs.readFileSync('productions/la-novia-del-vampiro/.studio/state.json','utf8'));
const ff=await findFFmpeg(s.config);
for(const t of [0.5,4,8,11.5]) await command(ff,['-y','-hide_banner','-loglevel','error','-ss',String(t),'-i','productions/la-novia-del-vampiro/media/higgsfield/EP001-REBUILD-C01-v1.mp4','-frames:v','1','-q:v','3',`productions/la-novia-del-vampiro/review-drafts/EP001-first-minute/REBUILD-C01-${t}.jpg`]);
const a=await command(ff,['-hide_banner','-i','productions/la-novia-del-vampiro/media/higgsfield/EP001-REBUILD-C01-v1.mp4','-af','silencedetect=noise=-36dB:d=0.25,ebur128=peak=true','-vn','-f','null','-'],{allowFailure:true});
fs.writeFileSync('productions/la-novia-del-vampiro/review-drafts/EP001-first-minute/REBUILD-C01-audio-v1.txt',a.stderr);
