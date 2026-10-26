import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import { init } from '../src/studio.js';
import { importNarrative, importScript, repository } from '../src/narrative.js';
import { plan, prepareReferences, attachReference, validateShot, validateSource } from '../src/planning.js';
import { latest, json, atomic, save } from '../src/store.js';
import { compile, adapter, registerH3Workflow, selectorDimensions } from '../src/adapters.js';
import { routeAdapter, validateCinematicDirection } from '../src/hybrid.js';
import { taskPacket } from '../src/tasks.js';
import { type Shot } from '../src/contracts.js';
import { importContinuity } from '../src/continuity.js';
import { dep } from '../src/store.js';
import { approveJobs, validateRecovery, enqueue, retireUnsubmittedJob } from '../src/generation.js';
import { validateTimeline } from '../src/editing.js';

async function fixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),'hybrid-contract-'));const s=await init(root,'Hybrid contract fixture','microdrama');s.project.profile.maxShotSeconds=12;
 await importNarrative(root,s,await json(path.join(repository,'examples/the-spare-key/narrative.json')),true,'test');plan(s,{},true);prepareReferences(s);
 const shot=latest(s.shots).find(x=>x.beatIds.length>1)!;assert.ok(shot);
 shot.durationReason='Contract fixture: consecutive approved beats in two timed shots.';shot.durationSeconds=107/24;
 shot.generationMode='h3_reference_to_video';shot.routingReason='Physical source action with reusable references.';shot.strategy='multi-shot';
 const refs=shot.referenceIds.map(id=>s.references.find(r=>r.id===id)!);
 shot.referencePlan={references:[...refs].reverse().map(r=>({referenceId:r.id,role:r.kind,usage:'Preserve the approved visual asset; guidance only.'})),subjects:shot.characterIds.map((id,i)=>({subjectId:`SUBJECT-${i+1}`,characterId:id,description:s.characters.find(c=>c.id===id)!.name,wardrobe:'Approved source wardrobe.',referenceIds:[refs.find(r=>r.kind==='identity')!.id]})),shots:[{id:'CIN-1',beatIds:shot.beatIds.slice(0,1),inSeconds:0,outSeconds:2,transition:'start',composition:'Medium shared view.',action:'Perform only the first source beat.',camera:'Locked camera.',continuity:'Keep the established axis.'},{id:'CIN-2',beatIds:shot.beatIds.slice(1),inSeconds:2,outSeconds:shot.durationSeconds,transition:'hard-cut',composition:'Closer view on the same axis.',action:'Continue the remaining source beats.',camera:'Locked camera.',continuity:'Preserve prop ownership and screen direction.'}],retentionAnalysis:'Preserve each referenced identity and prop.',continuityRequirements:['Preserve the source geography across the cut.'],expectedOutput:'One video containing two shots.',validationCriteria:['Review every cut, source word, identity and object interaction.']};
 const file=path.join(root,'SIMULATED-reference.txt');await writeFile(file,'Contract fixture only; never sent to a real model.');
 for(const r of refs)await attachReference(root,s,r.id,file,'synthetic-contract-fixture',true);
 return {root,s,shot};
}
test('H3 reuses references, emits ordered multi-shot prose and leaves LTX board coverage separate',async()=>{
 assert.deepEqual(selectorDimensions(720,1280,0.4),{width:480,height:864});
 const {root,s,shot}=await fixture();validateShot(s,shot);const count=s.references.length;prepareReferences(s,{shot:shot.id});assert.equal(s.references.length,count);assert.ok(!s.references.some(r=>r.shotIds.includes(shot.id)&&r.kind==='start'));
 const pack=await compile(root,s,shot,'mock');assert.equal(pack.generationMode,'h3_reference_to_video');assert.deepEqual(pack.references.map(r=>r.id),shot.referencePlan!.references.map(r=>r.referenceId));
 assert.deepEqual(Object.keys(pack.structuredPrompt!),['subject_definitions','summary','retention_analysis','detailed_description','overall_soundscape','non_diegetic_music']);assert.match(pack.prompt,/HARD CUT/);assert.doesNotMatch(pack.prompt,/no internal cuts/);assert.match(pack.prompt,/very first frame/);assert.match(pack.structuredPrompt!.non_diegetic_music,/None throughout/);
 for(const line of shot.dialogue)assert.equal(pack.prompt.split(`“${line.text}”`).length-1,1);
 const packet=taskPacket(s,'prompts',{shot:shot.id});assert.equal(packet.shotPlanningContract!.imageContinuityContract!.mandatory,false);assert.equal(packet.hybridDirection.referencePlans.length,1);
 assert.equal(routeAdapter(shot),'comfy-h3-ref2v');assert.equal(routeAdapter({...shot,generationMode:'ltx_i2v',strategy:'i2v'}),'comfy-i2v');assert.equal(routeAdapter({...shot,generationMode:undefined,strategy:'reference-video'}),'comfy-h3-fast-ref');
});
test('H3 rejects missing identity, repeated beats, temporal gaps, and invalid routing',async()=>{
 const {s,shot}=await fixture();const changed=(fn:(x:Shot)=>void)=>{const copy=structuredClone(shot);fn(copy);return ()=>validateShot(s,copy);};
 assert.throws(changed(x=>x.referencePlan!.subjects=[]),/too small|identity mapping/i);
 assert.throws(changed(x=>x.referencePlan!.shots[1].inSeconds=2.5),/timestamps/);
 assert.throws(changed(x=>x.referencePlan!.shots[1].beatIds.push(x.beatIds[0])),/source beats/);
 assert.throws(changed(x=>x.referencePlan!.references[0].role='start'),/role mismatch/);
 assert.throws(changed(x=>x.routingReason=undefined),/routingReason/);
 s.config.comfy.apiWorkflows['comfy-h3-ref2v']={path:'fixture',bindings:{},verified:true,minSeconds:5/24,maxSeconds:107/24};
 assert.throws(changed(x=>x.durationSeconds=5.01),/limit is/);
});
test('H3 accepts an opening frame among the ordered references and explicitly targets time zero',async()=>{
 const {root,s,shot}=await fixture();const entry=shot.referencePlan!.references[0];const ref=s.references.find(r=>r.id===entry.referenceId)!;ref.kind='start';entry.role='start';
 validateShot(s,shot);const pack=await compile(root,s,shot,'mock');assert.equal(pack.references[0].role,'start');assert.match(pack.structuredPrompt!.subject_definitions,/<Picture 1>.*0\.00-second opening/);
});
test('H3 production copy binds ordered images with a simulated service and never submits a render',async()=>{
 const {root,s,shot}=await fixture();let posts=0;
 const nodeInfo=(type:string)=>({[type]:{input:{required:{},optional:type==='MiniMaxH3ReferenceToVideo'?{ref_images:['COMFY_AUTOGROW_V3',{template:{max:9}}]}:{}}}});
 const server=createServer((req,res)=>{if(req.method==='POST')posts++;res.setHeader('Content-Type','application/json');const type=decodeURIComponent(req.url!.split('/').at(-1)!);const info=nodeInfo(type);if(type==='MiniMaxH3ReferenceToVideo')(info[type].input.required as any).length=['INT',{max:3600}];res.end(JSON.stringify(info));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));s.config.comfy.url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;s.config.comfy.root=path.join(root,'SIMULATED-comfy');
 const source=path.join(root,'SIMULATED-source.api.json');const graph={'1':{class_type:'MiniMaxH3ReferenceToVideo',inputs:{prompt:'fixture',width:576,height:1024,length:107}},'2':{class_type:'SelfLiftH3Sampler',inputs:{positive:['1',0],seed:1}},'3':{class_type:'CreateVideo',inputs:{images:['2',0],fps:24}},'4':{class_type:'SaveVideo',inputs:{video:['3',0],filename_prefix:'fixture'}}};await atomic(source,graph);const before=await readFile(source,'utf8');
 try{
  await registerH3Workflow(root,s,source,'legacy');assert.equal(await readFile(source,'utf8'),before);
  await assert.rejects(compile(root,s,shot,'comfy-h3-ref2v'),/Simulated reference/);
  const bad=structuredClone(shot);bad.durationSeconds=4.4;bad.referencePlan!.shots[1].outSeconds=4.4;await assert.rejects(compile(root,s,bad,'comfy-h3-ref2v'),/17\*n\+5/);
  const pack=await compile(root,s,shot,'mock');pack.adapter='comfy-h3-ref2v';
  const job:any={id:'SIMULATED-H3-CONTRACT',package:pack};await adapter('comfy-h3-ref2v').prepare(root,s,job,{prepareOnly:true});
  const prepared=await json(path.join(root,'generation',job.id,'workflow.api.json'));assert.equal(prepared['1'].inputs.length,107);
  for(let i=0;i<pack.references.length;i++){assert.deepEqual(prepared['1'].inputs[`ref_images.ref_image_${i}`],[`studio-reference-${i+1}`,0]);assert.match(prepared[`studio-reference-${i+1}`].inputs.image,new RegExp(pack.references[i].id));}
  assert.equal(posts,0);
  await writeFile(s.config.comfy.apiWorkflows['comfy-h3-ref2v'].path,'changed');await assert.rejects(compile(root,s,shot,'comfy-h3-ref2v'),/workflow changed/);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

async function officialFixture(){
 const f=await fixture();const {s,shot}=f;s.project.profile.maxShotSeconds=30;
 const c=importContinuity(s,{id:'CONT-KEY-ROOM',version:1,status:'approved',deps:[],sceneId:shot.sceneId,canonicalText:'A quiet shop at night. Warm light falls on a wooden counter. The same door, brass key, wardrobe, positions and eyelines persist throughout this sequence.',set:'Small shop, wooden counter and one entrance.',spatialMap:'Two adults stand on opposite sides of the counter.',axis:'Camera remains on the entrance side.',lighting:'Warm practical light at night.',characters:shot.characterIds.map(id=>({characterId:id,wardrobe:'Dark work clothes.',position:'At the counter.',voice:'Natural conversational voice.',physicalState:'Standing still.'})),props:[{name:'Brass key',state:'On the counter.'}]});
 shot.generationMode='h3_fast_ref';shot.beatType='DIALOGUE';shot.sequenceContinuity=dep(c);shot.deps.push(dep(c));
 shot.durationSeconds=481/24;shot.referencePlan!.shots[0].outSeconds=10;shot.referencePlan!.shots[1].inSeconds=10;shot.referencePlan!.shots[1].outSeconds=shot.durationSeconds;
 for(const subject of shot.referencePlan!.subjects){const ref=s.references.find(r=>r.kind==='identity'&&s.assets.some(a=>a.id===r.assetId&&a.ownerId===subject.characterId))!;assert.ok(ref);subject.referenceIds=[ref.id];}
 shot.direction={version:1,genre:'Intimate relationship drama',dramaticObjective:'Make the returned key test whether the relationship can continue.',turn:'Withdrawal becomes a tentative willingness to stay.',audienceExperience:'Notice a small decision through a withheld response.',visualTreatment:'Warm window side light, close human distance, restrained focus shifts between the listening faces and the key.',coverageReason:'The first view establishes the key; the cut lets the listener reconsider.',characters:shot.characterIds.map(characterId=>({characterId,objective:'Find out whether the other person still wants contact.',obstacle:'Neither wants to ask directly.',subtext:'The key is an excuse to stay.',emotionalProgression:'Guarded attention becomes hesitant interest.'}))};
 for(const [i,part] of shot.referencePlan!.shots.entries()){part.visibleSubjectIds=shot.referencePlan!.subjects.map(x=>x.subjectId);part.dramaticPurpose=i?'Make the response change the meaning of the key.':'Establish the key as a possible farewell.';part.performance='The listener watches the key before meeting the speaker’s eyes, holding back an immediate reply.';if(i)part.cutReason='The listener now understands the offer differently.';}
 shot.referencePlan!.dialogueStaging=shot.dialogue.map(line=>{const part=shot.referencePlan!.shots.find(x=>x.beatIds.includes(line.beatId))!;const lines=shot.dialogue.filter(x=>part.beatIds.includes(x.beatId)),i=lines.indexOf(line),step=(part.outSeconds-part.inSeconds)/lines.length;return {beatId:line.beatId,speakerId:line.speakerId,shotId:part.id,strategy:'on-camera',lipSync:'required',inSeconds:part.inSeconds+i*step,outSeconds:part.inSeconds+(i+1)*step,rationale:'Read the original speaker’s face while the line tests the relationship.'};});
 return {...f,c};
}

test('Fountain offscreen and voice-over cues retain speaker and acting notes without speaking the parenthetical',async()=>{
 const {root,s,shot,c}=await officialFixture();const heading=latest(s.scenes).find(x=>x.id===shot.sceneId)!.heading;
 const eli=latest(s.characters).find(x=>x.name==='Eli')!.id,nora=latest(s.characters).find(x=>x.name==='Nora')!.id;
 const text=heading+"\n\nNora waits inside. Eli stands beyond the door.\n\nELI (O.S.)\n(gently)\nKeep it.\n\nNORA\nWhat?\n\nELI (V.O.)\nI never left.\n";
 await importScript(root,s,'EP001',text,true,'fixture');plan(s,{episode:'EP001'});
 const beats=latest(s.beats).filter(b=>b.source.scriptVersion===2).sort((a,b)=>a.source.start-b.source.start),spoken=beats.filter(b=>b.kind==='dialogue');
 assert.deepEqual(spoken.map(b=>({speaker:b.speakerId,delivery:b.delivery,text:b.text})),[{speaker:eli,delivery:'offscreen',text:'Keep it.'},{speaker:nora,delivery:undefined,text:'What?'},{speaker:eli,delivery:'voice-over',text:'I never left.'}]);
 assert.deepEqual(spoken[0].performanceNotes,['gently']);assert.equal(spoken[0].source.quote.includes('(gently)'),true);
 for(const b of beats)validateSource(s,b.source);
 const scene=latest(s.scenes).find(x=>x.id===shot.sceneId)!,script=s.scripts.at(-1)!;
 const nextContinuity=importContinuity(s,{...c,deps:[dep(scene)],canonicalText:c.canonicalText+' Eli stays beyond the closed door; Nora listens inside.'});
 const directed=structuredClone(shot);directed.status='approved';directed.beatIds=beats.map(x=>x.id);directed.deps=[dep(script),dep(scene),dep(nextContinuity),...beats.map(dep)];directed.sequenceContinuity=dep(nextContinuity);
 directed.dialogue=spoken.map(b=>({speakerId:b.speakerId!,beatId:b.id,text:b.text}));
 directed.startState=spoken[0].source.quote;directed.endState=spoken[2].source.quote;
 const p=directed.referencePlan!;p.shots[0].beatIds=beats.slice(0,2).map(x=>x.id);p.shots[1].beatIds=beats.slice(2).map(x=>x.id);
 p.dialogueStaging=spoken.map((b,i)=>({beatId:b.id,speakerId:b.speakerId!,shotId:p.shots[i?1:0].id,strategy:'on-camera',lipSync:'required',inSeconds:i?10+(i-1)*4:2,outSeconds:i?13+(i-1)*4:5,rationale:'Synthetic source-cue preservation test.'}));
 assert.throws(()=>validateShot(s,directed),/Source marks this voice offscreen/);
 for(const part of p.shots)part.visibleSubjectIds=p.subjects.filter(x=>x.characterId===nora).map(x=>x.subjectId);
 for(const a of p.dialogueStaging)if(a.speakerId===eli){a.strategy='reaction-audio';a.lipSync='none';}
 const pack=await compile(root,s,directed,'mock');
 assert.equal(pack.prompt.includes('Keep it.'),false);assert.equal(pack.prompt.includes('I never left.'),false);assert.equal(pack.prompt.includes('(gently)'),false);
 assert.equal(pack.prompt.split('“What?”').length-1,1);assert.equal((pack.parameters.externalDialogue as any[]).length,2);
});

test('official compilation rejects an undirected historical scaffold while its state remains readable',async()=>{
 const {root,s,shot}=await officialFixture();shot.direction=undefined;
 validateShot(s,shot); // Old contracts and known remote jobs are not silently migrated.
 await assert.rejects(compile(root,s,shot,'mock'),/Cinematic direction required/);
 assert.equal(taskPacket(s,'production',{shot:shot.id}).stage,'shots');
 await save(root,s);const file=path.join(root,'undirected-import.json');await atomic(file,[shot]);
 const before=await readFile(path.join(root,'.studio/state.json'),'utf8');
 const rejected=spawnSync(process.execPath,[path.join(repository,'bin/studio.mjs'),'-p',root,'plan','--shot',shot.id,'--import-shots',file,'--approve','--dry-run'],{encoding:'utf8'});
 assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/Cinematic direction required/);assert.equal(await readFile(path.join(root,'.studio/state.json'),'utf8'),before);
});

test('cinematic coverage requires acting, meaningful cuts and a deliberate continuous take, without a cut quota',async()=>{
 const {s,shot}=await officialFixture();validateCinematicDirection(shot);
 const bad=structuredClone(shot);bad.referencePlan!.shots[1].performance=undefined;assert.throws(()=>validateCinematicDirection(bad),/observable performance/);
 bad.referencePlan!.shots[1].performance='Her gaze drops to the key.';bad.referencePlan!.shots[1].cutReason=undefined;assert.throws(()=>validateCinematicDirection(bad),/cutReason/);
 const continuous=structuredClone(shot),p=continuous.referencePlan!;p.shots=[{...p.shots[0],beatIds:continuous.beatIds,outSeconds:continuous.durationSeconds}];continuous.strategy='reference-video';p.dialogueStaging!.forEach(a=>a.shotId=p.shots[0].id);
 assert.throws(()=>validateCinematicDirection(continuous),/singleShotReason/);continuous.direction!.singleShotReason='Hold both people and the key together as neither commits to leaving.';
 s.project.profile.maxShotSeconds=12;validateShot(s,continuous);validateCinematicDirection(continuous); // A 20s continuous official take is allowed by native unit bounds, not the legacy 12s coverage limit.
});

test('speaker staging rejects a visible substitute and independent words require replacement audio at edit',async()=>{
 const {root,s,shot}=await officialFixture(),p=shot.referencePlan!,a=p.dialogueStaging![0];assert.ok(a);
 const part=p.shots.find(x=>x.id===a.shotId)!,speaker=p.subjects.find(x=>x.characterId===a.speakerId)!;
 part.visibleSubjectIds=part.visibleSubjectIds!.filter(id=>id!==speaker.subjectId);
 assert.throws(()=>validateCinematicDirection(shot),/visible source speaker/);
 a.strategy='reaction-audio';a.lipSync='none';validateCinematicDirection(shot);
 const pack=await compile(root,s,shot,'mock'),line=shot.dialogue.find(x=>x.beatId===a.beatId)!;
 assert.equal(pack.prompt.includes(line.text),false,'Offscreen source words must not leak through state text');assert.equal((pack.parameters.externalDialogue as any[]).some(x=>x.text===line.text),true);assert.equal(pack.parameters.requiresReplacementMix,true);
 assert.ok(!pack.structuredPrompt!.subject_definitions.includes(speaker.description)||p.shots.some(x=>x.visibleSubjectIds!.includes(speaker.subjectId)));
 const seg={shotId:shot.id,takeId:'FIXTURE-TAKE',sourceIn:0,sourceOut:shot.durationSeconds,audio:'native' as const,transition:'cut' as const};
 const take={id:seg.takeId,version:1,status:'approved' as const,deps:[],shotId:shot.id,jobId:'FIXTURE-JOB',file:'not-rendered.mp4',sha256:'0'.repeat(64),simulated:true,technical:'pass' as const,audiovisual:'simulated' as const,inSeconds:0,outSeconds:shot.durationSeconds};s.takes.push(take);
 const timeline={id:'INDEPENDENT-AUDIO-FIXTURE',version:1,status:'draft' as const,deps:[dep(shot),dep(take)],episodeId:shot.episodeId,segments:[seg],audioTracks:[],subtitles:[],subtitleStatus:'simulated' as const,normalizeAudio:true};
 assert.throws(()=>validateTimeline(s,timeline),/replacement mix/);
 validateTimeline(s,{...timeline,segments:[{...seg,audio:'external',externalAudio:'reviewed-full-mix.wav'}]});
 const shifted=structuredClone(shot);shifted.referencePlan!.dialogueStaging![0].outSeconds=shot.durationSeconds+1;assert.throws(()=>validateCinematicDirection(shifted),/Speech windows/);
});

test('new prompts compile directed acting and timing with one full audio policy and one brief reminder',async()=>{
 const {root,s,shot}=await officialFixture();const pack=await compile(root,s,shot,'mock');
 assert.match(pack.prompt,/Intimate relationship drama/);assert.match(pack.prompt,/Performance: The listener/);assert.match(pack.prompt,/lips synchronized/);
 assert.equal(pack.prompt.split('From the very first frame').length-1,1);assert.equal(pack.prompt.split('Preserve natural quiet between planned sounds.').length-1,1);
 assert.doesNotMatch(pack.prompt,/dramaticObjective|coverageReason|singleShotReason/);assert.ok(pack.parameters.direction);
});

test('recovery records evidence and a repeated attribution error changes coverage or audio instead of appending prohibitions',async()=>{
 const {root,s,shot}=await officialFixture(),pack=await compile(root,s,shot,'mock');
 const job:any={id:'PRIOR-RENDER',shotId:shot.id,shotVersion:shot.version,state:'succeeded',package:pack};s.jobs.push(job);
 const r={fromJobId:job.id,category:'speaker-attribution',diagnosis:'User listening report: the visible listener speaks the hidden speaker’s words.',action:'prompt-refinement',changedVariable:'Speaker staging wording',expectedImprovement:'Only the source actor mouths the words.'};
 validateRecovery(s,shot,r);await assert.rejects(enqueue(root,s,'mock',{shot:shot.id},{alternative:true}),/--recovery/);
 s.jobs.push({...job,id:'FIRST-RECOVERY',package:{...pack,parameters:{recovery:r}}});
 validateRecovery(s,shot,r); // A prepared or successful test is not itself evidence of a repeated failure.
 s.takes.push({id:'FAILED-ATTRIBUTION-FIXTURE',version:1,status:'rejected',deps:[],shotId:shot.id,jobId:'FIRST-RECOVERY',file:'not-rendered.mp4',sha256:'0'.repeat(64),simulated:true,technical:'pass',audiovisual:'fail'});
 assert.throws(()=>validateRecovery(s,shot,r),/new coverage or independent audio/);
 assert.throws(()=>validateRecovery(s,shot,{...r,action:'redirect'}),/newly imported/);
 const redirected=structuredClone(shot);redirected.version++;validateRecovery(s,redirected,{...r,action:'redirect'});
 job.state='uncertain';assert.throws(()=>validateRecovery(s,redirected,{...r,action:'redirect'}),/existing remote ID/);
});

test('superseded preparation may be retired without deleting history or touching submitted renders',async()=>{
 const {root,s,shot}=await officialFixture(),[job]=await enqueue(root,s,'mock',{shot:shot.id});
 const fingerprint=job.fingerprint;retireUnsubmittedJob(s,job.id);assert.equal(job.state,'stale');assert.equal(job.fingerprint,fingerprint);assert.equal(s.jobs.includes(job),true);
 job.state='running';job.remoteId='KNOWN-REMOTE';assert.throws(()=>retireUnsubmittedJob(s,job.id),/known remote IDs/);assert.equal(job.state,'running');
});

test('official Fast Ref and Motion reuse exact continuity, admit incidental text subjects, and keep analysis outside model text',async()=>{
 const {root,s,shot,c}=await officialFixture();validateShot(s,shot);
 shot.referencePlan!.retentionAnalysis='The Question: editorial metadata only.';
 const pack=await compile(root,s,shot,'mock');
 assert.equal(routeAdapter(shot),'comfy-h3-fast-ref');assert.equal(routeAdapter({...shot,generationMode:'h3_motion'}),'comfy-h3-motion');
 assert.equal(pack.prompt.split(c.canonicalText).length-1,1);
 assert.doesNotMatch(pack.prompt,/The Question|\[Shot |retention_analysis|subject_definitions/);
 assert.match(pack.structuredPrompt!.retention_analysis,/The Question/);
 for(const line of shot.dialogue)assert.equal(pack.prompt.split(`“${line.text}”`).length-1,1);
 const second=structuredClone(shot);second.id='CONTINUATION-UNIT';second.startState='They absorb the decision already made.';second.generationMode='h3_motion';
 assert.ok((await compile(root,s,second,'mock')).prompt.includes(c.canonicalText));
 const subject=shot.referencePlan!.subjects[1];subject.referenceIds=[];subject.textOnlyReason='Incidental unrecognizable background presence.';validateShot(s,shot);
 subject.textOnlyReason=undefined;assert.throws(()=>validateShot(s,shot),/Text-only subjects/);
 subject.referenceIds=shot.referencePlan!.subjects[0].referenceIds;assert.throws(()=>validateShot(s,shot),/another subject/);
 const packet=taskPacket(s,'prompts',{shot:shot.id});assert.equal(packet.sequenceContinuities[0].id,c.id);assert.equal(packet.reference_manifest.length,shot.referenceIds.length);
});

test('continuity revisions preserve source and invalidate only dependent production; identical import is idempotent',async()=>{
 const {s,shot,c}=await officialFixture();const scripts=JSON.stringify(s.scripts);const independent=s.shots.find(x=>x.id!==shot.id)!;const status=independent.status;
 assert.equal(importContinuity(s,c),c);assert.equal(shot.status,'approved');
 const next=importContinuity(s,{...c,canonicalText:c.canonicalText+' The counter remains fully visible.'});
 assert.equal(next.version,2);assert.equal(c.status,'stale');assert.equal(shot.status,'stale');assert.equal(independent.status,status);assert.equal(JSON.stringify(s.scripts),scripts);
});

test('supplied Fast Ref graph registers independent variants with native twenty-second frames and never posts',async()=>{
 const {root,s,shot}=await officialFixture();let posts=0;
 const server=createServer((req,res)=>{if(req.method==='POST')posts++;const type=decodeURIComponent(req.url!.split('/').at(-1)!);res.setHeader('Content-Type','application/json');res.end(JSON.stringify({[type]:{input:{required:type==='MiniMaxH3ReferenceToVideo'?{length:['INT',{min:5,max:3600}]}:{},optional:type==='MiniMaxH3ReferenceToVideo'?{ref_images:['COMFY_AUTOGROW_V3',{template:{max:9}}]}:{}}}}));});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));s.config.comfy.url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;s.config.comfy.root=path.join(root,'SIMULATED-comfy');
 try{
  const source=path.join(repository,'assets/workflows/video_fasth3_omniref_r2v.api.json'),before=await readFile(source,'utf8');
  const fast=await registerH3Workflow(root,s,source,'fast-ref');assert.equal(fast.maxSeconds,481/24);assert.equal(fast.resolutionMegapixels,0.4);assert.ok('duration' in fast.bindings);assert.equal(fast.bindings.duration.node,'132');
  // The same graph is a binding fixture only; it does not establish real Motion capability.
  const motion=await registerH3Workflow(root,s,source,'motion');assert.notEqual(fast.path,motion.path);
  assert.equal(await readFile(source,'utf8'),before);
  await assert.rejects(compile(root,s,shot,'comfy-h3-motion'),/requires comfy-h3-fast-ref/);
  const pack=await compile(root,s,shot,'mock');pack.adapter='comfy-h3-fast-ref';const job:any={id:'SIMULATED-FAST-REF',package:pack};
  await adapter(pack.adapter).prepare(root,s,job,{prepareOnly:true});const graph=await json(path.join(root,'generation',job.id,'workflow.api.json'));
  assert.equal(graph['132'].inputs.value,481/24);assert.equal(graph['115'].inputs.megapixels,0.4);assert.equal(graph['124'].inputs.steps,8);
  assert.equal(graph['136'].inputs.prompt,pack.prompt);assert.equal(posts,0);
 }finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
});

test('premium episode budget counts prior reservations and cannot be bypassed by multiple approvals',async()=>{
 const {s,shot}=await officialFixture();s.config.budget=100;s.config.premiumBudgetPerEpisode=8;
 const make=(id:string,estimate:number,reserved:boolean)=>({id,shotId:shot.id,shotVersion:shot.version,episodeId:shot.episodeId,sceneId:shot.sceneId,fingerprint:id,state:'queued' as const,estimate,paid:true,reserved});
 s.jobs.push(make('PREVIOUS',5,true) as any,make('CURRENT',4,false) as any);
 assert.throws(()=>approveJobs(s,{}, {local:false,paid:true,maxCost:20,reason:'Explicit fixture authorization'}),/episode budget/);
 s.jobs[1].estimate=3;assert.equal(approveJobs(s,{}, {local:false,paid:true,maxCost:20,reason:'Explicit fixture authorization'}).allowPaid,true);
});

test('submit mode checkpoints the remote ID and returns without polling; production handoff advances to QA and editing',async()=>{
 const {root,s,shot}=await officialFixture();s.config.completionMode='submit';let posts=0,history=0;const checkpoints:unknown[]=[];
 const server=createServer((req,res)=>{res.setHeader('Content-Type','application/json');if(req.url==='/queue')res.end(JSON.stringify({queue_running:[],queue_pending:[]}));else if(req.url==='/prompt'){posts++;res.end(JSON.stringify({prompt_id:'SIMULATED-REMOTE-ID'}));}else{history++;res.end('{}');}});
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));s.config.comfy.url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 const job:any={id:'SIMULATED-SUBMISSION',state:'queued'};await atomic(path.join(root,'generation',job.id,'workflow.api.json'),{});
 try{const file=await adapter('comfy-h3-fast-ref').execute(root,s,job,async()=>{checkpoints.push({state:job.state,remoteId:job.remoteId});});assert.equal(file,undefined);assert.equal(job.remoteId,'SIMULATED-REMOTE-ID');assert.deepEqual(checkpoints,[{state:'uncertain',remoteId:undefined},{state:'running',remoteId:'SIMULATED-REMOTE-ID'}]);assert.equal(posts,1);assert.equal(history,0);}finally{await new Promise<void>(resolve=>server.close(()=>resolve()));}
 s.takes.push({id:'SIMULATED-TAKE',version:1,status:'pending',deps:[],shotId:shot.id,jobId:job.id,file:'not-rendered.mp4',sha256:'0'.repeat(64),simulated:true,technical:'pending',audiovisual:'pending'});
 assert.equal(taskPacket(s,'production',{shot:shot.id}).stage,'review');shot.selectedTakeId='SIMULATED-TAKE';assert.equal(taskPacket(s,'production',{shot:shot.id}).stage,'edit');
});
