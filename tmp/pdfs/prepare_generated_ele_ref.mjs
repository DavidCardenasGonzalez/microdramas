import fs from 'node:fs';
import {findFFmpeg,command} from '../../dist/src/media.js';
const s=JSON.parse(fs.readFileSync('productions/la-novia-del-vampiro/.studio/state.json','utf8'));
const ff=await findFFmpeg(s.config);
const input='productions/la-novia-del-vampiro/references/characters/eleanor-ashford-triptych-v1.png';
const output='tmp/pdfs/eleanor-generated-ref.jpg';
await command(ff,['-y','-hide_banner','-loglevel','error','-i',input,'-vf','scale=640:-1','-q:v','8',output]);
console.log(fs.statSync(output).size);
