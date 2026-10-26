import fs from 'node:fs';
import {findFFmpeg, command} from '../../dist/src/media.js';
const root='productions/la-novia-del-vampiro';
const s=JSON.parse(fs.readFileSync(root+'/.studio/state.json','utf8'));
const ff=await findFFmpeg(s.config);
const out=root+'/review-drafts/EP001-first-minute';
fs.mkdirSync(out,{recursive:true});
const result=[];
for(let i=1;i<=3;i++){
 const file=`${root}/media/higgsfield/EP001-K4-U00${i}-v1.mp4`;
 await command(ff,['-y','-hide_banner','-loglevel','error','-i',file,'-vf',"fps=1,scale=180:320,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='%{pts\\:hms}':fontsize=15:fontcolor=white:box=1:boxcolor=black@0.7:x=4:y=4,tile=5x4",'-frames:v','1',`${out}/clip-${i}-contact.png`]);
 const r=await command(ff,['-hide_banner','-i',file,'-af','silencedetect=noise=-36dB:d=0.25,ebur128=peak=true','-vn','-f','null','-'],{allowFailure:true,timeoutMs:60000});
 const scene=await command(ff,['-hide_banner','-i',file,'-vf',"select='gt(scene,0.23)',showinfo",'-an','-f','null','-'],{allowFailure:true,timeoutMs:60000});
 fs.writeFileSync(`${out}/clip-${i}-audio-analysis.txt`,r.stderr);
 fs.writeFileSync(`${out}/clip-${i}-scene-detection.txt`,scene.stderr);
 const extracts=[];
 for(const t of [0.04,0.5,18.5,19.5,19.95]){
  const img=`${out}/clip-${i}-${String(t).replace('.','p')}.jpg`;
  await command(ff,['-y','-hide_banner','-loglevel','error','-ss',String(t),'-i',file,'-frames:v','1','-q:v','3',img]);
  extracts.push({seconds:t,file:img});
 }
 result.push({clip:i,contactSheet:`${out}/clip-${i}-contact.png`,frames:extracts,audio:r.stderr.split('\n').filter(x=>/silence_(start|end)|I:|Peak:|LRA:/.test(x)).slice(-20),sceneCuts:[...scene.stderr.matchAll(/pts_time:([\d.]+)/g)].map(x=>+x[1])});
}
fs.writeFileSync(`${out}/inspection-v1.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({ffmpeg:ff,results:result.map(x=>({clip:x.clip,audio:x.audio,sceneCuts:x.sceneCuts}))},null,2));
