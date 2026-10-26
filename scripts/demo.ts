import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { init, validateProject, progress } from '../src/studio.js';
import { importNarrative, narrativeRequest, repository } from '../src/narrative.js';
import { plan, prepareReferences, attachReference, planningArtifacts } from '../src/planning.js';
import { simulatedImage } from '../src/media.js';
import { enqueue, executeQueue } from '../src/generation.js';
import { technicalReview, visualReview, selectTake } from '../src/review.js';
import { createTimeline, render } from '../src/editing.js';
import { save, latest, json, atomic, now } from '../src/store.js';
import { directSpareKey } from '../src/example-direction.js';
const root=path.resolve(process.argv[2]??path.join(repository,'productions',`demo-${Date.now()}`));
const s=await init(root,'The spare key — SIMULATED pipeline proof','microdrama');s.project.profile.maxShotSeconds=12;
s.project.profile.episodes=1;s.project.profile.width=360;s.project.profile.height=640;s.project.profile.durationSeconds=[25,60];s.project.profile.distribution=[{name:'preview',width:180,height:320}];s.config.concurrency=2;
await narrativeRequest(root,s,'A daughter returns her father’s shop key. A quiet offer lets her choose whether to return.');
await importNarrative(root,s,await json(path.join(repository,'examples/the-spare-key/narrative.json')),true,'Codex / authorized original example');
plan(s,{},true);directSpareKey(s);prepareReferences(s);await planningArtifacts(root,s);
for(const ref of latest(s.references)){const file=path.join(root,'references','drafts',`${ref.id}.SIMULATED.png`);await simulatedImage(file,s.config);await attachReference(root,s,ref.id,file,'synthetic-fixture',true);}
await save(root,s);await enqueue(root,s,'mock');await executeQueue(root,s);const jobCount=s.jobs.length;await executeQueue(root,s);if(s.jobs.length!==jobCount)throw Error('Resume repeated jobs');
await technicalReview(root,s);
for(const take of latest(s.takes)){visualReview(s,take.id,'pass','synthetic-fixture-only',['Synthetic test chart; no real identity, acting, speech or sync approval.']);const job=s.jobs.find(j=>j.id===take.jobId)!;await selectTake(root,s,take.id,0.25,job.package.durationSeconds-0.25);}
const t=createTimeline(s,'EP001');t.status='approved';t.subtitleStatus='simulated';let offset=0;
for(const seg of t.segments){const shot=latest(s.shots).find(x=>x.id===seg.shotId)!;const duration=seg.sourceOut-seg.sourceIn;if(shot.dialogue.length){const step=duration/shot.dialogue.length;shot.dialogue.forEach((d,i)=>t.subtitles.push({start:offset+i*step,end:offset+(i+1)*step-0.05,text:d.text}));}offset+=duration;}
await save(root,s);const result=await render(root,s,'EP001',{burnSubtitles:true});await save(root,s);const validation=await validateProject(root,s);await atomic(path.join(root,'demo-report.json'),{at:now(),root,simulated:true,validation,status:progress(s),master:result.export.file,technical:result.qa,resume:'successful jobs reused',note:'Synthetic charts and sine audio only; not an AI acted film.'});console.log(JSON.stringify({root,...result,validation},null,2));
