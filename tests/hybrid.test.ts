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
import { latest, json, atomic, save, load } from '../src/store.js';
import { compile, adapter, registerH3Workflow, selectorDimensions, auditWorkflowInputs } from '../src/adapters.js';
import { routeAdapter, validateCinematicDirection } from '../src/hybrid.js';
import { taskPacket } from '../src/tasks.js';
import { generateReference } from '../src/reference-generation.js';
import { validateDialogue } from '../src/dialogue.js';
import { type Shot } from '../src/contracts.js';
import { importSequencePlan, validateSequence } from '../src/sequences.js';
import { importCinematicStyle } from '../src/cinematography.js';
import { importContinuity } from '../src/continuity.js';
import { dep } from '../src/store.js';
import { approveJobs, validateRecovery, enqueue, retireUnsubmittedJob } from '../src/generation.js';
import { visualReview, sequenceReview, sequenceQuality, cinematicChecks } from '../src/review.js';
import { createTimeline, validateTimeline, render, importTimeline } from '../src/editing.js';

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
 const c=importContinuity(s,{id:'CONT-KEY-ROOM',version:1,status:'approved',deps:[],sceneId:shot.sceneId,scope:'invariants',canonicalText:'A quiet shop at night. Warm light falls on a wooden counter. The brass key has a worn round bow. Dark work clothes remain consistent.',set:'Small shop, wooden counter and one entrance.',spatialMap:'Two adults stand on opposite sides of the counter.',axis:'Camera remains on the entrance side.',lighting:'Warm practical light at night.',characters:shot.characterIds.map(id=>({characterId:id,wardrobe:'Dark work clothes.',voice:'Natural conversational voice.'})),props:[{name:'Brass key',state:'Worn brass with a round bow.'}]});
 const style=importCinematicStyle(s,{id:'STYLE-KEY',version:1,status:'approved',deps:[],genre:'Relationship drama',subgenre:'Intimate reconciliation',aestheticReferences:'Restrained contemporary studio drama',colorPalette:'Amber practicals against blue night windows',lighting:'Soft motivated window side light and warm practicals, natural skin contrast',performanceStyle:'Underplayed listening; eyes move before words, breath catches on the offer',rhythm:'Let the decision register, then cut on the listener changing attention',cameraLanguage:'Intimate close-ups, purposeful dolly movement and focus reveals as the relationship shifts',realism:'Photographic skin and believable weight, real-time human movement',genreTreatment:'Find romantic uncertainty in the distance between faces and the abandoned key'});shot.cinematicStyle=dep(style);shot.deps.push(dep(style));
 shot.visualEvidence=[];shot.generationMode='h3_fast_ref';shot.beatType='DIALOGUE';shot.sequenceContinuity=dep(c);shot.deps.push(dep(c));
 shot.durationSeconds=481/24;shot.referencePlan!.shots[0].outSeconds=10;shot.referencePlan!.shots[1].inSeconds=10;shot.referencePlan!.shots[1].outSeconds=shot.durationSeconds;
 for(const subject of shot.referencePlan!.subjects){const ref=s.references.find(r=>r.kind==='identity'&&s.assets.some(a=>a.id===r.assetId&&a.ownerId===subject.characterId))!;assert.ok(ref);subject.referenceIds=[ref.id];}
 shot.direction={version:1,genre:'Intimate relationship drama',dramaticObjective:'Make the returned key test whether the relationship can continue.',turn:'Withdrawal becomes a tentative willingness to stay.',audienceExperience:'Notice a small decision through a withheld response.',visualTreatment:'Warm window side light, close human distance, restrained focus shifts between the listening faces and the key.',coverageReason:'The first view establishes the key; the cut lets the listener reconsider.',characters:shot.characterIds.map(characterId=>({characterId,objective:'Find out whether the other person still wants contact.',obstacle:'Neither wants to ask directly.',subtext:'The key is an excuse to stay.',emotionalProgression:'Guarded attention becomes hesitant interest.'}))};
 for(const [i,part] of shot.referencePlan!.shots.entries()){part.visibleSubjectIds=shot.referencePlan!.subjects.map(x=>x.subjectId);part.dramaticPurpose=i?'Make the response change the meaning of the key.':'Establish the key as a possible farewell.';part.performance='The listener watches the key before meeting the speaker’s eyes, holding back an immediate reply.';if(i)part.cutReason='The listener now understands the offer differently.';}
 shot.referencePlan!.dialogueStaging=shot.dialogue.map(line=>{const part=shot.referencePlan!.shots.find(x=>x.beatIds.includes(line.beatId))!;const lines=shot.dialogue.filter(x=>part.beatIds.includes(x.beatId)),i=lines.indexOf(line),step=(part.outSeconds-part.inSeconds)/lines.length;return {beatId:line.beatId,speakerId:line.speakerId,shotId:part.id,strategy:'on-camera',lipSync:'required',inSeconds:part.inSeconds+i*step,outSeconds:part.inSeconds+i*step+Math.min(step,Math.max(0.7,line.text.split(/\s+/).length/2.2+0.3)),language:'en',intent:'Ask gently while studying the listener',rationale:'Read the original speaker’s face while the line tests the relationship.'};});
 const sequence=importSequencePlan(s,{id:'SEQ-KEY',version:1,status:'approved',deps:[],sceneIds:[shot.sceneId],unitIds:[shot.id],dramaticArc:'A key turns from farewell into permission to remain.',coverage:'Object-led intimacy becomes a listening reaction, designed before allocating generation time.',transitions:[]});
 shot.sequencePlan=dep(sequence);shot.deps.push(dep(sequence));
 const start={characters:shot.characterIds.map(characterId=>({characterId,presence:'present' as const,position:'At the counter',posture:'Standing',hands:'Empty relaxed hands',wardrobe:'Dark work clothes',injuries:'None',eyeline:'Toward the other person',emotion:'Guarded'})),props:[{id:'KEY',state:'On the counter',ownerId:null}],doors:[{id:'DOOR',state:'Closed'}],completedActionIds:[],spokenBeatIds:[]};
 shot.dynamicState={start,end:{...structuredClone(start),spokenBeatIds:shot.dialogue.map(x=>x.beatId),completedActionIds:shot.beatIds.filter(id=>s.beats.some(b=>b.id===id&&b.kind==='action'))}};
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
 const directed=structuredClone(shot);directed.status='approved';directed.beatIds=beats.map(x=>x.id);directed.deps=[dep(script),dep(scene),dep(nextContinuity),directed.cinematicStyle!,...beats.map(dep)];directed.sequenceContinuity=dep(nextContinuity);
 directed.dialogue=spoken.map(b=>({speakerId:b.speakerId!,beatId:b.id,text:b.text}));
 directed.startState=spoken[0].source.quote;directed.endState=spoken[2].source.quote;
 const seq=importSequencePlan(s,{...s.sequencePlans.at(-1)!,unitIds:[directed.id]});directed.sequencePlan=dep(seq);directed.deps.push(dep(seq));
 directed.dynamicState!.start.spokenBeatIds=[];directed.dynamicState!.end.spokenBeatIds=directed.dialogue.map(x=>x.beatId);directed.dynamicState!.end.completedActionIds=beats.filter(b=>b.kind==='action').map(b=>b.id);
 const p=directed.referencePlan!;p.shots[0].beatIds=beats.slice(0,2).map(x=>x.id);p.shots[1].beatIds=beats.slice(2).map(x=>x.id);
 p.dialogueStaging=spoken.map((b,i)=>({beatId:b.id,speakerId:b.speakerId!,shotId:p.shots[i?1:0].id,strategy:'on-camera',lipSync:'required',inSeconds:i?10+(i-1)*4:2,outSeconds:i?13+(i-1)*4:5,language:'en',intent:'Keep the voice low, with a restrained breath',rationale:'Synthetic source-cue preservation test.'}));
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
 const second=structuredClone(shot);second.id=shot.id;second.startState='They absorb the decision already made.';second.generationMode='h3_motion';
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
  const usage=await json(path.join(root,'generation',job.id,'input-usage.json'));assert.equal(usage.prompt.applied,true);assert.equal(usage.seed.applied,true);assert.equal(usage.negative.applied,false);
  const other=await compile(root,s,shot,'mock',undefined,pack.seed+1);other.adapter=pack.adapter;const otherJob:any={id:'SIMULATED-SEED-B',package:other};await adapter(other.adapter).prepare(root,s,otherJob,{prepareOnly:true});
  const otherGraph=await json(path.join(root,'generation',otherJob.id,'workflow.api.json'));const binding=fast.bindings.seed;assert.notEqual(graph[binding.node].inputs[binding.input],otherGraph[binding.node].inputs[binding.input]);otherGraph[binding.node].inputs[binding.input]=graph[binding.node].inputs[binding.input];otherGraph[fast.bindings.save.node].inputs[fast.bindings.save.input]=graph[fast.bindings.save.node].inputs[fast.bindings.save.input];for(const id of Object.keys(graph).filter(id=>id.startsWith('studio-reference-'))){assert.equal(path.basename(otherGraph[id].inputs.image),path.basename(graph[id].inputs.image));otherGraph[id].inputs.image=graph[id].inputs.image;}assert.deepEqual(otherGraph,graph);
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


test('stage 1: production style survives compilation, genre varies, and revisions invalidate dependents only',async()=>{
 const {root,s,shot}=await officialFixture();
 const style=s.cinematicStyles[0],pack=await compile(root,s,shot,'mock');
 assert.match(pack.prompt,/^Ultra-photorealistic scene from a premium Hollywood Relationship drama/);
 for(const key of ['colorPalette','lighting','performanceStyle','rhythm','cameraLanguage','realism','genreTreatment'] as const)assert.ok(pack.prompt.includes(style[key]));
 const next=importCinematicStyle(s,{...style,genre:'Romantic comedy',subgenre:'Workplace romance'});
 assert.equal(next.version,2);assert.equal(shot.status,'stale');assert.equal(style.status,'stale');
 assert.equal(importCinematicStyle(s,next),next);
 shot.status='approved';shot.cinematicStyle=dep(next);shot.deps=shot.deps.filter(d=>d.id!==next.id).concat(dep(next));
 const romcom=await compile(root,s,shot,'mock');assert.match(romcom.prompt,/Hollywood Romantic comedy/);assert.doesNotMatch(romcom.prompt,/suspense thriller feature/);
 delete shot.cinematicStyle;await assert.rejects(compile(root,s,shot,'mock'),/cinematicStyle/);
});


async function threeClipConversation(){
 const f=await officialFixture(),{root,s,shot:template}=f;
 await importScript(root,s,template.episodeId,'INT. SHOP - NIGHT\n\nNORA\nI put the key on the counter.\n\nELI\nThen I will stay here.\n\nNORA\nClose the door behind you.',true,'scenario');plan(s,{episode:template.episodeId});
 const scene=latest(s.scenes)[0],beats=latest(s.beats).filter(b=>b.sceneId===scene.id);
 const c=importContinuity(s,{...f.c,sceneId:scene.id});
 const seq=importSequencePlan(s,{id:'SEQ-THREE',version:1,status:'approved',deps:[],sceneIds:[scene.id],unitIds:['UNIT-A','UNIT-B','UNIT-C'],dramaticArc:'Permission to stay changes from an object into a shared decision.',coverage:'Begin close on the decision; response and object reaction continue the exchange. No repeated establishing view.',transitions:[{fromUnitId:'UNIT-A',toUnitId:'UNIT-B',technique:'Hard cut to the listening response',reason:'The answer changes who can leave',reestablishing:false},{fromUnitId:'UNIT-B',toUnitId:'UNIT-C',technique:'Match eyeline into a tighter reaction',reason:'The door now marks commitment',reestablishing:false}]});
 let start=structuredClone(template.dynamicState!.start);start.spokenBeatIds=[];start.completedActionIds=[];
 const units=beats.map((beat,i)=>{
  const unit=structuredClone(template);unit.id=seq.unitIds[i];unit.sceneId=scene.id;unit.scriptId=scene.scriptId;unit.version=1;unit.status='approved';unit.beatIds=[beat.id];unit.dialogue=[{beatId:beat.id,speakerId:beat.speakerId!,text:beat.text}];unit.sequencePlan=dep(seq);unit.sequenceContinuity=dep(c);unit.deps=[dep(s.scripts.find(x=>x.id===scene.scriptId&&x.version===scene.source.scriptVersion)!),dep(seq),dep(c),unit.cinematicStyle!,dep(scene),dep(beat),...unit.referenceIds.map(id=>dep(latest(s.references).find(r=>r.id===id)!))];
  unit.durationSeconds=107/24;unit.durationReason='Natural short sentence followed by the listener deciding where to look.';unit.direction!.singleShotReason='Let this response land before transferring attention.';
  unit.referencePlan!.shots=[{...unit.referencePlan!.shots[0],id:'VIEW',beatIds:[beat.id],inSeconds:0,outSeconds:unit.durationSeconds,composition:i===0?'Tight close-up of Nora with the key at the bottom edge.':i===1?'Medium close-up of Eli reacting on the same axis.':'Close-up of Nora, then focus moves to the closed door.',action:'Continue the exchange from the inherited physical state.'}];
  unit.referencePlan!.dialogueStaging=[{beatId:beat.id,speakerId:beat.speakerId!,shotId:'VIEW',strategy:'on-camera',lipSync:'required',inSeconds:0.3,outSeconds:3.1,language:'en',intent:'Let the offer escape cautiously, then listen',rationale:'Read the original speaker while the other person listens.'}];
  const end=structuredClone(start);end.spokenBeatIds.push(beat.id);if(i===0){end.characters[0].posture='Standing upright';end.characters[0].hands='Empty after releasing the key';end.props[0].state='Resting flat on the counter';}if(i===1)end.characters[1].emotion='Tentatively committed';
  unit.dynamicState={start:structuredClone(start),end};start=structuredClone(end);return unit;
 });
 s.shots.push(...units);return {...f,units,seq};
}

test('stage 2: a globally planned three-clip conversation inherits positions, hands, props, emotion and spoken words',async()=>{
 const {root,s,units,seq}=await threeClipConversation();
 for(const unit of units){validateSequence(s,unit);const p=await compile(root,s,unit,'mock');assert.match(p.prompt,/premium Hollywood/);}
 const next=await compile(root,s,units[1],'mock');assert.match(next.prompt,/Resting flat on the counter/);assert.doesNotMatch(next.prompt,/I put the key/);
 assert.equal(seq.transitions.every(t=>!t.reestablishing),true);
 const bad=structuredClone(units[1]);bad.dynamicState!.start.props[0].state='Back inside Nora’s fist';assert.throws(()=>validateSequence(s,bad),/Continuity reset/);
 const repeat=structuredClone(units[1]);repeat.dialogue=[units[0].dialogue[0]];assert.throws(()=>validateSequence(s,repeat),/already spoken/);
 const missing=structuredClone(units[1]);missing.dynamicState=undefined;assert.throws(()=>validateSequence(s,missing),/Dynamic start\/end/);
 assert.equal(taskPacket(s,'shots',{shot:units[1].id}).sequenceNeighbors.length,3);
});


async function dialogueScenario(kind:'bathroom'|'phone'){
 const f=await officialFixture(),{root,s,shot}=f;
 const molly=s.characters.find(c=>c.name==='Nora')!,steve=s.characters.find(c=>c.name==='Eli')!;molly.name='Molly';steve.name='Steve';
 const guest={...molly,id:'CHAR-GUEST',name:'Guest',description:'An incidental adult guest in a white shirt.'};if(kind==='bathroom')s.characters.push(guest);
 const text=kind==='bathroom'
  ? 'INT. BATHROOM / HALLWAY - NIGHT\n\nMolly kisses Guest beside the basin. Steve waits in the hallway beyond the closed door.\n\nSTEVE\nMolly, are you in there?\n\nMOLLY\nJust a second.'
  : 'INT. APARTMENT / OFFICE - NIGHT\n\nMolly holds a phone in a warm apartment. Steve sits with his phone in a cool office across town.\n\nMOLLY\nDid you keep my key?\n\nSTEVE\nI hoped you would come back.\n\nMOLLY\nThen wait for me.';
 await importScript(root,s,shot.episodeId,text.replace(/\n/g,'\n'),true,'scenario');plan(s,{episode:shot.episodeId});
 const scene=latest(s.scenes)[0],beats=latest(s.beats).filter(b=>b.sceneId===scene.id),spoken=beats.filter(b=>b.kind==='dialogue');
 const c=importContinuity(s,{...f.c,sceneId:scene.id,canonicalText:kind==='bathroom'?'The bathroom has cream tiles and warm basin light. The adjacent hallway has amber wall sconces. A solid door separates them; camera stays on the basin side of the bathroom axis and the wall side of the hallway axis. Molly wears a dark dress; Steve wears a navy shirt; the incidental guest wears a white shirt.':'The apartment has warm tungsten table lamps and a tan sofa. The office across town has cool window light, a grey desk and a black chair. Molly wears a dark dress in the apartment; Steve wears a navy shirt in the office. Each has a black phone.'});
 const seq=importSequencePlan(s,{id:'SEQ-SCENARIO',version:1,status:'approved',deps:[],sceneIds:[scene.id],unitIds:[shot.id],dramaticArc:kind==='bathroom'?'Intimacy is interrupted by a voice at the door.':'A call changes a farewell into a return.',coverage:kind==='bathroom'?'Intimate kiss, hallway speaker, then the response inside.':'Intercut both important participants at their approved locations.',transitions:[]});
 shot.status='approved';shot.scriptId=scene.scriptId;shot.sceneId=scene.id;shot.beatIds=beats.map(b=>b.id);shot.characterIds=scene.characterIds;shot.dialogue=spoken.map(b=>({speakerId:b.speakerId!,beatId:b.id,text:b.text}));shot.sequencePlan=dep(seq);shot.sequenceContinuity=dep(c);shot.deps=[dep(scene),dep(seq),dep(c),shot.cinematicStyle!,dep(s.scripts.at(-1)!),...beats.map(dep),...shot.referenceIds.map(id=>dep(latest(s.references).find(r=>r.id===id)!))];
 shot.durationSeconds=kind==='bathroom'?243/24:311/24;
 const p=shot.referencePlan!;p.subjects.forEach(x=>x.description=s.characters.find(c=>c.id===x.characterId)!.name);
 if(kind==='bathroom')p.subjects.push({subjectId:'GUEST',characterId:guest.id,description:guest.description,wardrobe:'White shirt',referenceIds:[],textOnlyReason:'Incidental adult, seen in profile during the kiss only.'});
 const subject=(id:string)=>p.subjects.find(x=>x.characterId===id)!.subjectId;
 const groups=kind==='bathroom'?[beats.slice(0,1),beats.slice(1,2),beats.slice(2)]:[beats.slice(0,2),beats.slice(2,3),beats.slice(3)];
 const bounds=kind==='bathroom'?[0,2.5,6.8,shot.durationSeconds]:[0,4.2,8.5,shot.durationSeconds];
 p.shots=groups.map((group,i)=>({id:`VIEW-${i}`,beatIds:group.map(b=>b.id),inSeconds:bounds[i],outSeconds:bounds[i+1],transition:i?'hard-cut':'start',composition:kind==='bathroom'?(i===0?'Intimate close-up of Molly and the guest kissing by the basin.':i===1?'Close-up of Steve in the hallway, the closed door at frame edge.':'Close-up of Molly inside the bathroom, guest soft behind her.'):(i===1?'Close-up of Steve in the cool office, phone at his ear.':'Close-up of Molly in the warm apartment, phone at her ear.'),action:kind==='bathroom'?(i===0?'Molly kisses the guest.':i===1?'Steve knocks twice against the closed door.':'Molly breaks the kiss and steadies her breath.'):'The caller listens, then answers without changing location.',camera:i===0?'A slow lateral track discovers her face.':'Eye-level 75mm view with a slight push as the response lands.',continuity:kind==='bathroom'?'The door remains closed; nobody enters the other space.':'The two rooms remain separate, with consistent phone hands and screen directions.',visibleSubjectIds:kind==='bathroom'?(i===0?[subject(molly.id),'GUEST']:i===1?[subject(steve.id)]:[subject(molly.id),'GUEST']):[subject(i===1?steve.id:molly.id)],dramaticPurpose:i?'Transfer attention to the person whose answer changes the exchange.':'Read the intimacy before it is interrupted.',performance:i===1?'He swallows once, studies the door or phone, then releases his breath on the line.':'Her shoulders tense briefly; she covers uncertainty by smoothing her breath.',...(i?{cutReason:'Read the new speaker in the separate space without transferring voice to a listener.'}:{})}));
 p.dialogueStaging=spoken.map(b=>{const part=p.shots.find(x=>x.beatIds.includes(b.id))!;return {beatId:b.id,speakerId:b.speakerId!,shotId:part.id,strategy:'on-camera',lipSync:'required',inSeconds:part.inSeconds+0.3,outSeconds:part.inSeconds+0.3+Math.max(0.8,b.text.split(/\s+/).length/2.2),language:'en',intent:'Keep the voice intimate; catch the breath before answering',rationale:'Show the actual speaker at the source location.'};});
 shot.direction!.characters=shot.characterIds.map(characterId=>({...shot.direction!.characters[0],characterId}));
 const start={...structuredClone(shot.dynamicState!.start),characters:shot.characterIds.map(characterId=>({...shot.dynamicState!.start.characters[0],characterId,wardrobe:characterId===molly.id?'Dark dress':characterId===steve.id?'Navy shirt':'White shirt',position:kind==='bathroom'?(characterId===steve.id?'Hallway beyond closed door':'Bathroom by basin'):(characterId===steve.id?'Cool office':'Warm apartment'),hands:kind==='phone'?'Black phone held at the ear':'Relaxed hands'})),spokenBeatIds:[],completedActionIds:[]};
 shot.dynamicState={start,end:{...structuredClone(start),completedActionIds:beats.filter(b=>b.kind==='action').map(b=>b.id),spokenBeatIds:spoken.map(b=>b.id)}};
 return {...f,spoken};
}

test('stage 3: bathroom coverage cuts kiss to Steve in hallway and back to Molly with literal native speech',async()=>{
 const {root,s,shot}=await dialogueScenario('bathroom');const pack=await compile(root,s,shot,'mock');
 assert.equal(pack.prompt.split('HARD CUT.').length-1,2);assert.match(pack.prompt,/Steve in the hallway/);assert.match(pack.prompt,/Molly inside the bathroom/);
 for(const line of shot.dialogue)assert.equal(pack.prompt.split(`“${line.text}”`).length-1,1);
 const a=shot.referencePlan!.dialogueStaging![0];a.outSeconds=a.inSeconds+0.1;assert.throws(()=>validateDialogue(s,shot),/Implausible speech/);
 a.outSeconds=a.inSeconds+8;assert.throws(()=>validateDialogue(s,shot),/Implausible speech/);
 a.outSeconds=a.inSeconds+2;delete a.intent;assert.throws(()=>validateDialogue(s,shot),/interpretive intent/);
});

test('stage 3: phone call alternates two locations, rejects unspecified talking and never assigns an unseen voice to a visible listener',async()=>{
 const {root,s,shot}=await dialogueScenario('phone');const pack=await compile(root,s,shot,'mock');
 assert.match(pack.prompt,/Steve in the cool office/);assert.match(pack.prompt,/Molly in the warm apartment/);assert.equal(pack.prompt.split('HARD CUT.').length-1,2);
 const p=shot.referencePlan!,a=p.dialogueStaging![1],part=p.shots[1];part.visibleSubjectIds=p.shots[0].visibleSubjectIds;
 await assert.rejects(compile(root,s,shot,'mock'),/visible source speaker/);
 a.strategy='reaction-audio';a.lipSync='none';part.action='Molly listens in silence, then looks toward her door.';validateDialogue(s,shot);
 const independent=await compile(root,s,shot,'mock');assert.equal(independent.prompt.includes(shot.dialogue[1].text),false);assert.equal(independent.parameters.requiresReplacementMix,true);
 part.action='Molly talks on the phone.';assert.throws(()=>validateDialogue(s,shot),/Unspecified speech/);
});


test('stage 4: injured-foot evidence uses a detail, tracking reveal and emotional reactions without a fixed camera template',async()=>{
 const {root,s,shot,c}=await officialFixture();
 await importScript(root,s,shot.episodeId,'INT. SHOP - NIGHT\n\nBlood seeps through Nora’s shoe at the counter.\n\nNora grips the counter, masking pain as she shifts her weight.\n\nEli notices the blood and reaches toward her.',true,'scenario');plan(s,{episode:shot.episodeId});
 const scene=latest(s.scenes)[0],beats=latest(s.beats).filter(b=>b.sceneId===scene.id);
 const cont=importContinuity(s,{...c,sceneId:scene.id}),seq=importSequencePlan(s,{id:'SEQ-INJURY',version:1,status:'approved',deps:[],sceneIds:[scene.id],unitIds:[shot.id],dramaticArc:'Hidden pain becomes an unavoidable discovery.',coverage:'See the injury, follow the attempt to hide it, then read the witness.',transitions:[]});
 shot.status='approved';shot.sceneId=scene.id;shot.scriptId=scene.scriptId;shot.beatIds=beats.map(b=>b.id);shot.dialogue=[];shot.sequencePlan=dep(seq);shot.sequenceContinuity=dep(cont);shot.durationSeconds=209/24;shot.deps=[dep(s.scripts.at(-1)!),dep(scene),dep(seq),dep(cont),shot.cinematicStyle!,...beats.map(dep)];
 const p=shot.referencePlan!;p.dialogueStaging=[];const bounds=[0,2,5.5,shot.durationSeconds];
 const views=[['Extreme close-up of blood soaking through Nora’s shoe.','Blood slowly marks the shoe as her foot braces against the floor.','Low 85mm detail; track upward along her braced leg toward her gripping hand.','Her ankle tightens under the pain; the shoe visibly bears her weight.'],['Medium close-up of Nora gripping the counter.','She shifts her weight onto the other leg and hides a wince.','A small lateral dolly keeps her hand and face connected in depth.','Her lips press together and a shallow breath escapes before she meets his eyes.'],['Close-up of Eli with the shoe soft in the foreground.','He discovers the blood and reaches to support her.','Rack focus from the blood to his widening eyes, then a restrained push-in.','His gaze drops, breath stops briefly, and his reaching hand opens rather than grabs.']];
 p.shots=views.map((v,i)=>({...p.shots[0],id:`DETAIL-${i}`,beatIds:[beats[i].id],inSeconds:bounds[i],outSeconds:bounds[i+1],transition:i?'hard-cut':'start',composition:v[0],action:v[1],camera:v[2],performance:v[3],dramaticPurpose:i===0?'Make the injury legible before the attempted concealment.':i===1?'Read the cost of hiding the pain.':'Read the discovery changing his behavior.',...(i?{cutReason:'Transfer attention from evidence to the person whose response changes its meaning.'}:{})}));
 shot.visualEvidence=[{beatId:beats[0].id,detail:'Blood visibly soaking the shoe',shotId:'DETAIL-0',method:'Extreme close-up with sufficient contrast and readable contact with the floor'}];
 shot.dynamicState!.start.completedActionIds=[];shot.dynamicState!.start.spokenBeatIds=[];shot.dynamicState!.end.completedActionIds=shot.beatIds;shot.dynamicState!.end.spokenBeatIds=[];
 const pack=await compile(root,s,shot,'mock');assert.match(pack.prompt,/Extreme close-up of blood/);assert.match(pack.prompt,/lateral dolly/);assert.match(pack.prompt,/Rack focus/);assert.match(pack.prompt,/shallow breath/);assert.match(pack.prompt,/premium Hollywood/);
 shot.visualEvidence[0].shotId='MISSING';await assert.rejects(compile(root,s,shot,'mock'),/Visual evidence/);shot.visualEvidence[0].shotId='DETAIL-0';
 p.shots[0].playback='slow-motion';await assert.rejects(compile(root,s,shot,'mock'),/playbackReason/);p.shots[0].playbackReason='Let the first bead of blood register as the discovery anchor.';
 assert.match((await compile(root,s,shot,'mock')).prompt,/Intentional slow-motion playback for this interval only/);
});


test('stage 5: seed comparisons change only the seed, defaults vary per unit and do not change on retry',async()=>{
 const {root,s,units}=await threeClipConversation();const a=await compile(root,s,units[0],'mock'),retry=await compile(root,s,units[0],'mock'),b=await compile(root,s,units[1],'mock');
 assert.equal(a.seed,retry.seed);assert.notEqual(a.seed,b.seed);
 const x=await compile(root,s,units[0],'mock',undefined,42),y=await compile(root,s,units[0],'mock',undefined,43);
 assert.deepEqual({...x,seed:0},{...y,seed:0});assert.match(x.prompt,/^Ultra-photorealistic/);
 const graph:any={'prompt':{class_type:'Text',inputs:{text:x.prompt}},'negative':{class_type:'Text',inputs:{text:x.negative}},'sampler':{class_type:'Sampler',inputs:{positive:['prompt',0],seed:x.seed}},'save':{class_type:'SaveVideo',inputs:{video:['sampler',0],filename_prefix:'fixture'}}};
 const cfg:any={bindings:{prompt:{node:'prompt',input:'text'},negative:{node:'negative',input:'text'},seed:{node:'sampler',input:'seed'},save:{node:'save',input:'filename_prefix'}}};
 assert.equal(auditWorkflowInputs(graph,cfg,x).negative.applied,false,'Disconnected negative is not effective');graph.sampler.inputs.negative=['negative',0];assert.equal(auditWorkflowInputs(graph,cfg,x).negative.applied,true);
});

function syntheticAssessment(kind:keyof typeof cinematicChecks){return {viewedVideo:true,listenedAudio:true,samples:[{atSeconds:0,observation:'Synthetic contract sample at start; no real audiovisual claim.'},{atSeconds:1,observation:'Synthetic contract sample of a later state; no real audiovisual claim.'}],checks:Object.fromEntries(cinematicChecks[kind].map(key=>[key,{verdict:'pass',evidence:`Synthetic ${key} contract assertion, not a perceptual evaluation.`}]))};}

test('stage 5: individual approval requires temporal audiovisual evidence; export also requires continuity and narrative sequence reviews',async()=>{
 const {root,s,shot}=await officialFixture();s.shots=s.shots.filter(x=>x.id===shot.id);
 const take:any={id:'QA-CONTRACT-TAKE',version:1,status:'pending',deps:[dep(shot)],shotId:shot.id,jobId:'QA-CONTRACT-JOB',file:'NOT-RENDERED.mp4',sha256:'0'.repeat(64),simulated:false,technical:'pass',audiovisual:'pending',inSeconds:0,outSeconds:shot.durationSeconds};s.takes.push(take);
 assert.throws(()=>visualReview(s,take.id,'pass','contract-test',[]),/--assessment/);
 const av=syntheticAssessment('audiovisual');visualReview(s,take.id,'pass','contract-test',[],av);shot.selectedTakeId=take.id;
 const t=createTimeline(s,shot.episodeId);t.status='approved';t.subtitleStatus='verified';
 await assert.rejects(render(root,s,shot.episodeId),/continuity and narrative sequence QA/);
 sequenceReview(s,t.id,'continuity','pass','contract-test',[],syntheticAssessment('continuity'));
 await assert.rejects(render(root,s,shot.episodeId),/continuity and narrative sequence QA/);
 const bad=syntheticAssessment('narrative');bad.checks.rhythm.verdict='fail';assert.throws(()=>sequenceReview(s,t.id,'narrative','pass','contract-test',[],bad),/failed cinematic check/);
 sequenceReview(s,t.id,'narrative','pass','contract-test',[],syntheticAssessment('narrative'));assert.equal(sequenceQuality(s,t).every(x=>x.review?.verdict==='pass'),true);
 const revised=importTimeline(s,{...t});assert.equal(revised.version,t.version+1);assert.equal(sequenceQuality(s,revised).every(x=>!x.review),true);
 await assert.rejects(render(root,s,shot.episodeId),/continuity and narrative sequence QA/);
});


test('stage 5: CLI imports/approves complete sequence atomically and dry-run leaves the production untouched',async()=>{
 const {root,s,units}=await threeClipConversation();await save(root,s);
 const file=path.join(root,'directed-sequence.json');await atomic(file,units);
 const run=(args:string[])=>spawnSync(process.execPath,[path.join(repository,'bin/studio.mjs'),'-p',root,...args],{encoding:'utf8'});
 const before=await readFile(path.join(root,'.studio/state.json'),'utf8');
 const dry=run(['plan','--import-shots',file,'--replace-scene','--approve','--dry-run']);assert.equal(dry.status,0,dry.stderr);assert.equal(await readFile(path.join(root,'.studio/state.json'),'utf8'),before);
 const accepted=run(['plan','--import-shots',file,'--replace-scene','--approve']);assert.equal(accepted.status,0,accepted.stderr);
 const active=latest((await load(root)).shots);assert.deepEqual(active.map(x=>x.id),units.map(x=>x.id));
 const packet=run(['task','--stage','prompts','--shot',units[1].id,'--dry-run']);assert.equal(packet.status,0,packet.stderr);assert.equal(JSON.parse(packet.stdout).shotPlanningContract.ready,true);
 const changed=structuredClone(units);changed[1].dynamicState!.start.doors[0].state='Open';await atomic(file,changed);
 const stored=await readFile(path.join(root,'.studio/state.json'),'utf8');const rejected=run(['plan','--import-shots',file,'--replace-scene','--approve']);assert.notEqual(rejected.status,0);assert.match(rejected.stderr,/Continuity reset/);assert.equal(await readFile(path.join(root,'.studio/state.json'),'utf8'),stored);
 const styleFile=path.join(root,'style.json');await atomic(styleFile,s.cinematicStyles[0]);const styleDry=run(['cinematic-style','--import',styleFile,'--dry-run']);assert.equal(styleDry.status,0,styleDry.stderr);assert.equal(await readFile(path.join(root,'.studio/state.json'),'utf8'),stored);
});

test('stage 5: assembly follows global sequence order and demands a reason for editorial omissions or reorder',async()=>{
 const {s,units}=await threeClipConversation();s.shots=[units[2],units[0],units[1]];
 for(const unit of units){const take:any={id:`TAKE-${unit.id}`,version:1,status:'approved',deps:[dep(unit)],shotId:unit.id,jobId:'CONTRACT',file:'NOT-RENDERED.mp4',sha256:'0'.repeat(64),simulated:true,technical:'pass',audiovisual:'simulated',inSeconds:0,outSeconds:unit.durationSeconds};s.takes.push(take);unit.selectedTakeId=take.id;}
 const t=createTimeline(s,units[0].episodeId);assert.deepEqual(t.segments.map(x=>x.shotId),units.map(x=>x.id));
 const reversed={...t,segments:[...t.segments].reverse()};assert.throws(()=>validateTimeline(s,reversed),/global sequence order/);validateTimeline(s,{...reversed,editorialReason:'Synthetic test of an explicitly motivated editorial reorder; needs sequence QA for real media.'});
});


test('stage 5: exceptional premium direction preserves the same style, timed coverage and independent dialogue obligations',async()=>{
 const {root,s,shot}=await dialogueScenario('phone');shot.generationMode='seedance';shot.strategy='reference-video';shot.escalationReason='Synthetic compilation coverage only; no provider call or paid authorization.';
 const pack=await compile(root,s,shot,'mock');assert.match(pack.prompt,/premium Hollywood/);assert.equal(pack.prompt.split('HARD CUT.').length-1,2);
 const missing=structuredClone(shot);delete missing.cinematicStyle;await assert.rejects(compile(root,s,missing,'mock'),/cinematicStyle/);
});


test('stage 5: compiler rejects speech leaking through state and poetic quoted titles without changing approved words',async()=>{
 const {root,s,shot}=await officialFixture();
 const line=shot.dialogue[0];assert.ok(line);
 shot.dynamicState!.end.characters[0].emotion=`Still remembering “${line.text}”`;
 await assert.rejects(compile(root,s,shot,'mock'),/exactly once/);
 shot.dynamicState!.end.characters[0].emotion='Quietly reconsidering the offer';
 s.cinematicStyles[0].aestheticReferences='The sequence titled “The Question”';
 await assert.rejects(compile(root,s,shot,'mock'),/Unassigned quoted text/);
});


test('stage 5: new FLUX references require a production style before any workflow or model execution',async()=>{
 const {root,s,shot}=await officialFixture();s.cinematicStyles=[];
 await assert.rejects(generateReference(root,s,shot.referenceIds[0],{prompt:'A new character identity triptych.'}),/cinematic-style --import/);
 assert.equal(s.referenceJobs.length,0);
});
