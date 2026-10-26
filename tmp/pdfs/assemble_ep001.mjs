import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {findFFmpeg,command,checkMedia} from '../../dist/src/media.js';
const root='productions/la-novia-del-vampiro';
const state=JSON.parse(fs.readFileSync(root+'/.studio/state.json','utf8'));
const ff=await findFFmpeg(state.config);
const dir=root+'/review-drafts/EP001-first-minute';
const output=root+'/exports/review/EP001-first-minute-review-v1.mp4';
fs.mkdirSync(path.dirname(output),{recursive:true});
const sources=[1,2,3].map(i=>`${root}/media/higgsfield/EP001-K4-U00${i}-v1.mp4`);
const jobs=['75804ebc-4150-4f85-aa47-65588e295a96','8de9595d-5daa-44ca-8727-8d5285d9b521','0aab1526-9589-48a8-9b9a-69b0b06e8c20'];
// All ranges are frame aligned; only silent measured regions are shortened.
const segments=[
 {source:0,in:0.5,out:11.5,gainDb:-4.8,reason:'Remove half-second opening silence; retain Lucian offering his hand.'},
 {source:0,in:362/24,out:19.75,gainDb:-4.8,reason:'Cut to existing Eleanor close-up; remove 3.583 seconds of silent held gesture, retain all detected speech.'},
 {source:1,in:0.5,out:19.25,gainDb:-2.8,reason:'Trim only opening and trailing silence; preserve all dialogue and learning pauses.'},
 {source:2,in:0.5,out:18.25,gainDb:-6.1,reason:'Trim opening silence and excess final hold; retain over one second after final detected utterance.'}
];
const filters=[];let cursor=0;
for(let i=0;i<segments.length;i++){
 const s=segments[i],duration=s.out-s.in;s.timelineIn=cursor;s.timelineOut=cursor+duration;cursor+=duration;
 s.mediaId=`EP001-K4-U00${s.source+1}-v1`;s.jobId=jobs[s.source];s.file=path.resolve(sources[s.source]);
 s.sha256=crypto.createHash('sha256').update(fs.readFileSync(s.file)).digest('hex');
 filters.push(`[${s.source}:v]trim=start=${s.in}:end=${s.out},setpts=PTS-STARTPTS,setsar=1[v${i}]`);
 filters.push(`[${s.source}:a]atrim=start=${s.in}:end=${s.out},asetpts=PTS-STARTPTS,aresample=48000,volume=${s.gainDb}dB,afade=t=in:st=0:d=0.008,afade=t=out:st=${duration-0.008}:d=0.008[a${i}]`);
}
filters.push(segments.map((_,i)=>`[v${i}][a${i}]`).join('')+`concat=n=${segments.length}:v=1:a=1[v][a]`);
const args=['-y','-hide_banner','-loglevel','error',...sources.flatMap(file=>['-i',file]),'-filter_complex',filters.join(';'),'-map','[v]','-map','[a]','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-r','24','-c:a','aac','-b:a','192k','-movflags','+faststart',output];
fs.writeFileSync(dir+'/edit-decision-list-v1.json',JSON.stringify({skill:'review-and-assemble',status:'review-draft',nonDestructive:true,segments,durationSeconds:cursor,audio:'Fixed downward gains toward -16 LUFS per original clip; no speed change, music or added audio.',output:path.resolve(output),pending:['Literal dialogue and lip synchronization listening verification','Potential native generated music reported by automated analysis; needs confirmation'],command:{executable:ff,args}},null,2)+'\n');
await command(ff,args,{timeoutMs:180000});
const qa=await checkMedia(output,{width:720,height:1280,fps:24,duration:cursor},state.config);
fs.writeFileSync(dir+'/assembly-technical-qa-v1.json',JSON.stringify({output:path.resolve(output),sha256:crypto.createHash('sha256').update(fs.readFileSync(output)).digest('hex'),...qa},null,2)+'\n');
await command(ff,['-y','-hide_banner','-loglevel','error','-i',output,'-vf',"fps=1/2,scale=144:256,tile=7x4",'-frames:v','1',dir+'/assembled-contact-v1.png']);
console.log(JSON.stringify({output:path.resolve(output),durationSeconds:cursor,qa},null,2));
