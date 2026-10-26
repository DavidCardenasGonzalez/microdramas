import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { type State, type GenerationJob, PromptPackage as PackageSchema, type PromptPackage, type Shot } from './contracts.js';
import { dep, latest, fileSha, json, atomic, inside, exists, sha } from './store.js';
import { command, simulatedVideo } from './media.js';
import { validateShot } from './planning.js';
import { repository } from './narrative.js';
import { validateSpokenText } from './dialogue.js';
import { cinematicOpening } from './cinematography.js';
import { h3Prompt, isH3, routeAdapter, validateProductionDirection } from './hybrid.js';
export type Capabilities={id:string;paid:boolean;strategies:string[];minSeconds:number;maxSeconds:number;execution:'local'|'codex-bridge';verified:string};
export interface Adapter {capabilities:Capabilities;prepare(root:string,s:State,job:GenerationJob,options?:{prepareOnly?:boolean}):Promise<void>;execute(root:string,s:State,job:GenerationJob,checkpoint:()=>Promise<void>):Promise<string|undefined>;}
const productionAudioPolicy='From the very first frame through the final frame, use only the attributed dialogue and planned location sound. No music, score, intro/outro, musical stings, drones, risers, tonal pulses or synthetic dramatic accents, including music from devices. Preserve natural quiet between planned sounds.';
const productionNegative='unrequested transitions, duplicate people, anatomy defects, text or watermark, music, score, jingles, drones, risers, tonal pulses, synthetic dramatic accents';
export const capabilities:Record<string,Capabilities>={
 mock:{id:'mock',paid:false,strategies:['reference-video','i2v','flf2v','t2v','multi-shot'],minSeconds:1,maxSeconds:30,execution:'local',verified:'synthetic FFmpeg fixture; never real footage'},
 msr:{id:'msr',paid:false,strategies:['reference-video'],minSeconds:1,maxSeconds:15,execution:'local',verified:'existing runner + API base; doctor checks live nodes'},
 'comfy-i2v':{id:'comfy-i2v',paid:false,strategies:['i2v'],minSeconds:0,maxSeconds:0,execution:'local',verified:'duration unknown until configured; requires a verified flat API export'},
 'comfy-flf2v':{id:'comfy-flf2v',paid:false,strategies:['flf2v'],minSeconds:0,maxSeconds:0,execution:'local',verified:'duration unknown until configured; requires a verified flat API export'},
 'comfy-h3-ref2v':{id:'comfy-h3-ref2v',paid:false,strategies:['reference-video','multi-shot'],minSeconds:0,maxSeconds:0,execution:'local',verified:'H3_motion_ref2v: requires hashed API copy, live nodes/models and explicit Reference Plan; no render quality implied'},
 'comfy-h3-fast-ref':{id:'comfy-h3-fast-ref',paid:false,strategies:['reference-video','multi-shot'],minSeconds:0,maxSeconds:0,execution:'local',verified:'Fast H3 OmniRef API requires live registration; supplied template is not runtime evidence'},
 'comfy-h3-motion':{id:'comfy-h3-motion',paid:false,strategies:['reference-video','multi-shot'],minSeconds:0,maxSeconds:0,execution:'local',verified:'Motion API requires separate live registration; never substitute the Fast Ref checkpoint'},
 seedance:{id:'seedance',paid:true,strategies:['reference-video','i2v','flf2v','t2v'],minSeconds:4,maxSeconds:15,execution:'codex-bridge',verified:'Higgsfield seedance_2_0 contract; recheck availability and price before submission'},
 kling:{id:'kling',paid:true,strategies:['reference-video','i2v'],minSeconds:0,maxSeconds:0,execution:'codex-bridge',verified:'No universal Kling mapping: requires configured provider evidence, model and duration bounds'}
};
export function h3FramesForDuration(seconds:number){const raw=Math.max(5,Math.round(seconds*24));return raw+(5-(raw%17))%17;}
export function h3MaxDurationAtOrBelow(seconds:number){const maxFrames=Math.floor(seconds*24+1e-9);return (5+17*Math.floor((maxFrames-5)/17))/24;}
export function selectorDimensions(width:number,height:number,megapixels:number){const ratio=width/height,area=megapixels*1_000_000;let w:number,h:number;if(ratio<=1){h=Math.max(32,Math.ceil(Math.sqrt(area/ratio)/32)*32);w=Math.max(32,Math.round(ratio*h/32)*32);}else{w=Math.max(32,Math.ceil(Math.sqrt(area*ratio)/32)*32);h=Math.max(32,Math.round(w/ratio/32)*32);}return {width:w,height:h};}
export const defaultSeed=(s:State,shot:Shot,adapterId:string)=>parseInt(sha(`${s.project.id}:${shot.id}:${shot.version}:${adapterId}`).slice(0,8),16);
export async function compile(root:string,s:State,shot:Shot,adapterId:string,override?:string,seed?:number,allowUnverifiedWorkflow=false):Promise<PromptPackage>{
 seed=seed??defaultSeed(s,shot,adapterId);
 validateProductionDirection(s,shot);
 let cap=capabilities[adapterId];let workflowCfg:State['config']['comfy']['apiWorkflows'][string]|undefined;if(!cap)throw Error(`Unknown adapter ${adapterId}`);if(adapterId.startsWith('comfy-')){workflowCfg=s.config.comfy.apiWorkflows[adapterId];const cfg=workflowCfg;if((!cfg?.verified&&!allowUnverifiedWorkflow)||!cfg||cfg.maxSeconds<cfg.minSeconds)throw Error('Configure a verified API export with measured minSeconds/maxSeconds; unverified workflows may only be checked with --prepare-only');cap={...cap,minSeconds:cfg.minSeconds,maxSeconds:cfg.maxSeconds};}validateShot(s,shot);if(shot.status!=='approved')throw Error(`Shot is not approved: ${shot.id}`);if(s.diagnostics.some(d=>d.stage==='plan'&&d.severity==='blocker'&&[shot.id,shot.sceneId,shot.episodeId].includes(d.targetId??'')))throw Error('Unresolved source/plan diagnostics block generation');
 if(!cap.strategies.includes(shot.strategy))throw Error(`${adapterId} cannot execute ${shot.strategy}`);
 if(isH3(shot)&&adapterId!==routeAdapter(shot)&&adapterId!=='mock')throw Error(`H3 plan requires ${routeAdapter(shot)}`);
 if(['seedance','kling'].includes(shot.generationMode??'')&&adapterId!==shot.generationMode&&adapterId!=='mock')throw Error('Premium plan requires its directed provider');
 if(shot.generationMode==='ltx_i2v'&&adapterId!=='comfy-i2v'&&adapterId!=='mock')throw Error('LTX plan requires comfy-i2v');
 if(['comfy-h3-ref2v','comfy-h3-fast-ref','comfy-h3-motion'].includes(adapterId)){
  if(!isH3(shot)||!shot.referencePlan)throw Error('H3 requires an approved Reference Plan');
  if(!workflowCfg?.referenceNode||!workflowCfg.maxReferences||!workflowCfg.sha256||workflowCfg.framePolicy!=='h3-17n5')throw Error('Register H3_motion_ref2v with explicit reference bindings, hash and frame policy');
  if(await fileSha(workflowCfg.path)!==workflowCfg.sha256)throw Error('H3 workflow changed; re-register and inspect it');
  if(shot.referenceIds.length>workflowCfg.maxReferences)throw Error('H3 reference count exceeds verified adapter limit');
  if(shot.referencePlan.references.some(r=>r.role==='end'))throw Error('Literal last-frame binding is not verified in H3_motion_ref2v');
  const frames=Math.round(shot.durationSeconds*24);
  if(s.project.profile.fps!==24||Math.abs(frames/24-shot.durationSeconds)>0.0001||frames!==h3FramesForDuration(shot.durationSeconds))throw Error('H3 duration must match the native 17*n+5 workflow frame policy at 24 FPS; revise durationReason and timestamps, do not silently round');
 }
 if(adapterId==='seedance'&&s.config.bridge.model!=='seedance_2_0')throw Error('This adapter maps the verified seedance_2_0 contract only; register another model capability mapping before use');
 if(adapterId==='kling'){const cfg=s.config.bridge.kling;if(!cfg||cfg.maxSeconds<cfg.minSeconds)throw Error('Configure the actual Kling provider model, evidence and measured duration bounds');cap={...cap,minSeconds:cfg.minSeconds,maxSeconds:cfg.maxSeconds};}
 if(['seedance','kling'].includes(adapterId)&&!shot.escalationReason?.trim())throw Error('Premium generation requires a documented escalationReason');
 if(shot.durationSeconds<cap.minSeconds||shot.durationSeconds>cap.maxSeconds)throw Error(`Duration ${shot.durationSeconds}s unsupported by ${adapterId}; adjust shot planning explicitly.`);
 if(adapterId==='msr'&&(!((s.project.profile.width===720&&s.project.profile.height===1280)||(s.project.profile.width===1280&&s.project.profile.height===720))||s.project.profile.fps!==24))throw Error('Existing MSR runner requires 720x1280 or 1280x720 at 24 FPS');
 const references=[];
 for(const id of shot.referencePlan?.references.map(r=>r.referenceId)??shot.referenceIds){const r=latest(s.references).find(x=>x.id===id);if(!r||r.status!=='approved'||!r.file||!r.sha256)throw Error(`Mandatory reference not approved: ${id}`);const file=inside(root,r.file);if(await fileSha(file)!==r.sha256)throw Error(`Reference changed outside versioning: ${id}`);if(adapterId!=='mock'&&r.simulated)throw Error(`Simulated reference cannot drive a real generation: ${id}`);references.push({id:r.id,version:r.version,role:r.kind,file:r.file,sha256:r.sha256});}
 if(shot.strategy==='t2v'&&shot.referenceIds.length)throw Error('T2V cannot silently ignore mandatory references');
 if(shot.strategy!=='t2v'&&!references.length)throw Error('Reference-conditioned generation requires references');
 if(['i2v','flf2v'].includes(shot.strategy)&&!references.some(r=>r.role==='start'))throw Error('Start frame required');
 if(shot.strategy==='flf2v'&&!references.some(r=>r.role==='end'))throw Error('End frame required');
 const beats=shot.beatIds.map(id=>latest(s.beats).find(b=>b.id===id)!);

 const context=shot.characterIds.map(id=>latest(s.characters).find(c=>c.id===id)).filter(x=>!!x).map(c=>`${c!.name}: ${c!.description}`).join('\n');
 const wardrobeContext=shot.assetIds.map(id=>latest(s.assets).find(a=>a.id===id)).filter(a=>!!a&&a!.kind==='wardrobe').map(a=>`${a!.name}: ${a!.description}`).join('\n');
 const assetContext=shot.assetIds.map(id=>latest(s.assets).find(a=>a.id===id)).filter(x=>!!x&&x.kind!=='character').map(a=>`${a!.kind} — ${a!.name}: ${a!.description}`).join('\n');
 const sourceForBeats=(ids:string[])=>beats.filter(b=>ids.includes(b.id)).map(b=>{
  if(b.kind!=='dialogue')return b.source.quote;
  const line=shot.dialogue.find(x=>x.beatId===b.id);
  if(!line)return b.source.quote;
  const speaker=latest(s.characters).find(x=>x.id===line.speakerId)?.name??line.speakerId;
  const words=line.text.replace(/\s+/g,' ').trim();
  return `${speaker} says, “${words}”`;
 }).join('\n\n');
 const sourceContent=sourceForBeats(shot.beatIds);
 const withoutDialogue=(value:string)=>shot.dialogue.reduce((text,line)=>{
  const escaped=line.text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const said=new RegExp(`(?:[\\p{L}][\\p{L}'-]*\\s+)?(?:has\\s+)?(?:said|says|asked|asks|replied|replies|answered|answers|called|calls|whispered|whispers|muttered|mutters|told|tells)\\s*[“"']?${escaped}[”"']?`,'giu');
  const quoted=new RegExp(`[“"']${escaped}[”"']`,'giu');
  const name=latest(s.characters).find(c=>c.id===line.speakerId)?.name??line.speakerId;
  const cue=[name,line.speakerId].map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const rawCue=new RegExp(`(?:^|\\n)\\s*(?:${cue})\\s*\\r?\\n${escaped}(?=\\s|$)`,'giu');
  const sourceQuote=beats.find(b=>b.id===line.beatId)?.source.quote;
  return (sourceQuote?text.split(sourceQuote).join(''):text).replace(rawCue,'').replace(said,'').replace(quoted,'').replace(/\s{2,}/g,' ').replace(/\s+([,.;!?])/g,'$1').trim();
 },value);
 let prompt=[
  cinematicOpening(s,shot),productionAudioPolicy,
  `Duration: ${shot.durationSeconds} seconds. ${s.project.profile.width}:${s.project.profile.height} frame.`,
  context,wardrobeContext,assetContext,
  `Composition: ${shot.framing}. Camera: ${shot.camera.position}; ${shot.camera.lens}; ${shot.camera.movement}. Focus: ${shot.camera.focus}.`,
  `Action and observable performance: ${withoutDialogue(shot.blocking)}.`,
  sourceContent,
  `Initial state: ${withoutDialogue(shot.startState)}. Final state: ${withoutDialogue(shot.endState)}. Advance once between these states without resetting the action.`,
  `Axis: ${withoutDialogue(shot.continuity.axis)}. Eyelines: ${withoutDialogue(shot.continuity.eyelines)}. Wardrobe: ${withoutDialogue(shot.continuity.wardrobe)}. Props: ${withoutDialogue(shot.continuity.props)}. Lighting: ${withoutDialogue(shot.continuity.lighting)}.`,
  `Planned location sound: ${shot.sound.join('; ')||'natural quiet'}. Spoken language: ${s.project.profile.language}. Only attributed quoted words are spoken, once; all other prose directs the image.`,
  override?`Director correction: ${withoutDialogue(override)}`:'',
  'One continuous shot at real-time human speed, with no unrequested transition.',
  'Keep dialogue and planned location sound only through the final frame; no music or synthetic dramatic accents, including from devices.'
 ].filter(Boolean).join('\n\n');
 let structuredPrompt:Record<string,string>|undefined;
 if(shot.referencePlan){
  const cleanPlan={...shot.referencePlan!,subjects:shot.referencePlan!.subjects.map(x=>({...x,wardrobe:shot.dynamicState?.start.characters.find(c=>c.characterId===x.characterId)?.wardrobe??x.wardrobe})),shots:shot.referencePlan!.shots.map(x=>({...x,action:withoutDialogue(x.action),continuity:withoutDialogue(x.continuity),performance:x.performance?withoutDialogue(x.performance):undefined}))};
  const dialogueForBeats=(ids:string[])=>ids.filter(id=>beats.some(b=>b.id===id&&b.kind==='dialogue')).map(id=>{
   const staged=shot.referencePlan!.dialogueStaging?.find(x=>x.beatId===id);
   if(staged&&staged.strategy!=='on-camera')return ''; // Independent words stay in metadata for the replacement mix, never on another actor's mouth.
   return `${staged?`From ${staged.inSeconds.toFixed(3)} to ${staged.outSeconds.toFixed(3)} seconds, ${staged.language??s.project.profile.language}, ${staged.intent??'natural source delivery'}, with the source speaker visible and lips synchronized: `:''}${sourceForBeats([id])}`;
  }).filter(Boolean).join('\n\n');
  const h3=h3Prompt(s,{...shot,referencePlan:cleanPlan,startState:withoutDialogue(shot.startState),endState:withoutDialogue(shot.endState)},dialogueForBeats,productionAudioPolicy,override?withoutDialogue(override):undefined);
  prompt=h3.prompt;structuredPrompt=h3.sections;
 }
 validateSpokenText(shot,prompt);
 if(override&&/rewrite|replace dialogue|change dialogue/i.test(override))throw Error('Narrative corrections must return to Screenwriting');
 if(/\[INSERT\b|\bTODO\b/.test(prompt))throw Error('Resolve prompt placeholders before compilation');
 const selectorBound=!!workflowCfg?.resolutionMegapixels&&workflowCfg.bindings.width?.node===workflowCfg.bindings.height?.node;
 const dimensions=selectorBound?selectorDimensions(s.project.profile.width,s.project.profile.height,workflowCfg!.resolutionMegapixels!):(()=>{const scale=workflowCfg?.resolutionMegapixels?Math.sqrt(workflowCfg.resolutionMegapixels*1_000_000/(s.project.profile.width*s.project.profile.height)):1;return {width:workflowCfg?.resolutionMegapixels?Math.max(32,Math.round(s.project.profile.width*scale/32)*32):s.project.profile.width,height:workflowCfg?.resolutionMegapixels?Math.max(32,Math.round(s.project.profile.height*scale/32)*32):s.project.profile.height};})();
 const {width,height}=dimensions;
 const continuity=shot.sequenceContinuity?s.sequenceContinuities.find(x=>x.id===shot.sequenceContinuity!.id&&x.version===shot.sequenceContinuity!.version):undefined;
 return PackageSchema.parse({adapter:adapterId,shotId:shot.id,shotVersion:shot.version,strategy:shot.strategy,prompt,negative:productionNegative,references,durationSeconds:shot.durationSeconds,width,height,fps:s.project.profile.fps,seed,simulated:adapterId==='mock',parameters:{durationReason:shot.durationReason,...(shot.cinematicStyle?{cinematicStyle:s.cinematicStyles.find(x=>x.id===shot.cinematicStyle!.id&&x.version===shot.cinematicStyle!.version)}:{}),...(shot.sequencePlan?{sequencePlan:s.sequencePlans.find(x=>x.id===shot.sequencePlan!.id&&x.version===shot.sequencePlan!.version),dynamicState:shot.dynamicState}:{}),negativeApplication:{status:workflowCfg?.bindings.negative?'binding-declared-not-yet-audited':'metadata-only',binding:workflowCfg?.bindings.negative??null},...(adapterId==='seedance'?{model:s.config.bridge.model,resolution:'720p',mode:'std',generate_audio:true}:adapterId==='kling'?{model:s.config.bridge.kling!.model}:{}),...(continuity?{sequenceContinuity:continuity}:{}),...(shot.beatType?{beatType:shot.beatType}:{}),...(shot.direction?{direction:shot.direction}:{}),...(shot.referencePlan?.dialogueStaging?{externalDialogue:shot.referencePlan.dialogueStaging.filter(a=>a.strategy!=='on-camera').map(a=>({...a,text:shot.dialogue.find(line=>line.beatId===a.beatId)!.text})),requiresReplacementMix:shot.referencePlan.dialogueStaging.some(a=>a.strategy!=='on-camera')}:{})},...(shot.generationMode?{generationMode:shot.generationMode}:{}),...(structuredPrompt?{structuredPrompt,referencePlan:shot.referencePlan}:{})});
}
type Graph=Record<string,{class_type:string;inputs:Record<string,any>}>;
export function auditWorkflowInputs(graph:Graph,cfg:State['config']['comfy']['apiWorkflows'][string],p:PromptPackage){
 const output=cfg.bindings.save?.node;
 const connected=output?pruneGraph(graph,[output]):{};
 return Object.fromEntries((['prompt','negative','seed'] as const).map(key=>{
  const b=cfg.bindings[key],expected=p[key];
  const applied=!!b&&!!connected[b.node]&&connected[b.node].inputs[b.input]===expected;
  return [key,{applied,binding:b??null,reason:!b?'No workflow binding; metadata only':!connected[b.node]?'Binding node does not reach the saved output':applied?'Exact package value reaches the saved output; model response still requires QA':'Package value was not bound to this effective input'}];
 }));
}
export function pruneGraph(graph:Graph,outputs:string[]){const keep=new Set<string>();function visit(id:string){if(keep.has(id))return;const n=graph[id];if(!n)throw Error(`Missing graph node ${id}`);keep.add(id);for(const value of Object.values(n.inputs))if(Array.isArray(value)&&value.length===2&&typeof value[0]==='string'&&typeof value[1]==='number'&&graph[value[0]])visit(value[0]);}outputs.forEach(visit);return Object.fromEntries(Object.entries(graph).filter(([id])=>keep.has(id)));}
async function getJSON(s:State,endpoint:string){const r=await fetch(s.config.comfy.url+endpoint,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`ComfyUI ${endpoint}: HTTP ${r.status}`);return r.json() as Promise<any>;}
export async function validateGraph(s:State,graph:Graph){
 if(!graph||Array.isArray(graph)||'nodes' in graph)throw Error('Expected flat API graph, not canvas');
 for(const type of new Set(Object.values(graph).map(x=>x.class_type))){if(!type)throw Error('Graph has no class_type');const info=(await getJSON(s,`/object_info/${encodeURIComponent(type)}`))[type];if(!info)throw Error(`ComfyUI missing node ${type}`);
  for(const n of Object.values(graph).filter(n=>n.class_type===type)){
   for(const [key,raw] of Object.entries(info.input?.required??{})){const spec=raw as any;const dynamic=spec[0]==='COMFY_AUTOGROW_V3'&&Object.keys(n.inputs).some(k=>k.startsWith(key+'.'));if(!(key in n.inputs)&&!dynamic)throw Error(`${type} missing ${key}`);const value=n.inputs[key];if(type==='LoadImage'&&key==='image'&&typeof value==='string'){if(!await exists(inside(path.join(s.config.comfy.root,'input'),value)))throw Error(`Comfy input image does not exist: ${value}`);continue;}const choices=Array.isArray(spec[0])?spec[0]:spec[0]==='COMBO'?spec[1]?.options:undefined;if(Array.isArray(choices)&&!Array.isArray(value)&&!choices.includes(value))throw Error(`${type}.${key}: model/option not installed: ${value}`);if(typeof value==='number'&&((typeof spec[1]?.min==='number'&&value<spec[1].min)||(typeof spec[1]?.max==='number'&&value>spec[1].max)))throw Error(`${type}.${key}: value outside live node limits`);}
  }
 }
}
const graphFile=(root:string,job:GenerationJob)=>path.join(root,'generation',job.id,'workflow.api.json');
async function prepareMSR(root:string,s:State,job:GenerationJob){
 const pack=job.package,slug=`studio-${s.project.id}-${job.id}`;const dir=path.join(s.config.comfy.root,'input','productions',slug,'references');await mkdir(dir,{recursive:true});const refs:Record<string,string>={};let person=0;
 const ordered=[...pack.references.filter(r=>r.role==='identity'),...pack.references.filter(r=>r.role!=='identity')];
 for(const r of ordered){const filename=`${r.id}${path.extname(r.file)}`;await copyFile(inside(root,r.file),path.join(dir,filename));if(r.role==='location'){if(refs.background)throw Error('Multiple location references exceed MSR binding');refs.background=filename;}else{person++;if(person>4)throw Error('MSR supports at most four reference slots plus background');refs[`pic${person}`]=filename;}}
 if(!refs.pic1)throw Error('MSR needs a character/composition reference in pic1; no silent T2V fallback');
 // The existing base connects pic1/pic2/background only; builder checks actual available slots.
 const guideInfo=(await getJSON(s,'/object_info/ComfyUILTX25MSRMultiReferenceGuide')).ComfyUILTX25MSRMultiReferenceGuide;
 for(const slot of Object.keys(refs))if(!guideInfo?.input?.optional?.[slot]&&!guideInfo?.input?.required?.[slot])throw Error(`Installed MSR guide does not expose ${slot}`);
 const request={runner:s.config.comfy.msrRunner,base:s.config.comfy.msrBase,comfyRoot:s.config.comfy.root,shot:{id:job.id,duration_seconds:pack.durationSeconds,seed:pack.seed,prompt:pack.prompt,references_by_slot:refs},width:pack.width,height:pack.height,slug,referenceDir:path.dirname(dir),output:graphFile(root,job)};
 await atomic(path.join(root,'generation',job.id,'builder-request.json'),request);
 await command(s.config.comfy.python,[path.join(repository,'scripts','msr_graph.py'),path.join(root,'generation',job.id,'builder-request.json')]);
 const graph=pruneGraph(await json(graphFile(root,job)),['20']);await validateGraph(s,graph);await atomic(graphFile(root,job),graph);
}
async function prepareGeneric(root:string,s:State,job:GenerationJob,allowUnverified=false){const cfg=s.config.comfy.apiWorkflows[job.package.adapter];if(!cfg||(!cfg.verified&&!allowUnverified))throw Error('No verified API export configured. Export the actual canvas through ComfyUI frontend and configure bindings.');const graph:Graph=await json(cfg.path);if('nodes' in graph)throw Error('Canvas workflows are not executable API graphs');const p=job.package;
 const values:Record<string,unknown>={prompt:p.prompt,negative:p.negative,duration:p.durationSeconds,width:p.width,height:p.height,seed:p.seed,seed2:p.seed,fps:p.fps,save:`video/studio-${s.project.id}/${job.id}`};
 for(const role of ['start','end']){const ref=p.references.find(r=>r.role===role);if(ref){const folder=`productions/studio-${s.project.id}`;const filename=`${ref.id}-v${ref.version}${path.extname(ref.file)}`;await mkdir(path.join(s.config.comfy.root,'input',folder),{recursive:true});await copyFile(inside(root,ref.file),path.join(s.config.comfy.root,'input',folder,filename));values[role]=`${folder}/${filename}`;}}
 for(const key of ['prompt','duration','width','height','seed','fps','save','start',...(p.strategy==='flf2v'?['end']:[])])if(!cfg.bindings[key])throw Error(`Missing explicit workflow binding: ${key}`);
 const resolutionNode=cfg.bindings.width?.node===cfg.bindings.height?.node&&graph[cfg.bindings.width.node]?.class_type==='ResolutionSelector'?cfg.bindings.width.node:undefined;
 for(const [key,b] of Object.entries(cfg.bindings)){if(!(key in values))continue;if(!graph[b.node]?.inputs||!(b.input in graph[b.node].inputs))throw Error(`Invalid binding ${key}`);if(resolutionNode&&['width','height'].includes(key))continue;graph[b.node].inputs[b.input]=values[key];}
 if(resolutionNode){const ratio=p.width/p.height;const aspect=ratio<0.64?'9:16 (Portrait Widescreen)':ratio<0.8?'3:4 (Portrait Standard)':ratio<0.9?'2:3 (Portrait Photo)':ratio<1.1?'1:1 (Square)':ratio<1.5?'4:3 (Standard)':ratio<2?'16:9 (Widescreen)':'21:9 (Ultrawide)';const node=graph[resolutionNode];node.inputs[cfg.bindings.width.input]=aspect;node.inputs[cfg.bindings.height.input]=Number((p.width*p.height/1_000_000).toFixed(1));}
 await validateGraph(s,graph);await atomic(graphFile(root,job),graph);await atomic(path.join(root,'generation',job.id,'input-usage.json'),auditWorkflowInputs(graph,cfg,p));
}
export async function registerH3Workflow(root:string,s:State,source:string,variant:'fast-ref'|'motion'|'legacy'='fast-ref'){
 const graph:Graph=await json(source);if('nodes' in graph)throw Error('H3 registration needs the existing flat API export, not a canvas');
 const one=(type:string)=>{const matches=Object.entries(graph).filter(([,n])=>n.class_type===type);if(matches.length!==1)throw Error(`Expected one ${type} in H3 API export`);return matches[0][0];};
 const ref=one('MiniMaxH3ReferenceToVideo'),save=one('SaveVideo'),video=one('CreateVideo');
 const seedNodes=Object.entries(graph).filter(([,n])=>(n.class_type==='SelfLiftH3Sampler'&&'seed' in n.inputs)||(n.class_type==='RandomNoise'&&'noise_seed' in n.inputs));
 if(seedNodes.length!==1)throw Error('Expected one supported H3 seed input (SelfLiftH3Sampler.seed or RandomNoise.noise_seed)');
 const [sampler,seedNode]=seedNodes[0];const seedInput=seedNode.class_type==='RandomNoise'?'noise_seed':'seed';
 const info=(await getJSON(s,'/object_info/MiniMaxH3ReferenceToVideo')).MiniMaxH3ReferenceToVideo;
 const max=info?.input?.optional?.ref_images?.[1]?.template?.max;
 const liveLength=info?.input?.required?.length?.[1];
 if(!Number.isInteger(max)||max<1||!Number.isFinite(liveLength?.max)||liveLength.max<5)throw Error('Live H3 reference/frame limits unavailable');
 // Preserve a connected native duration and resolution selector in the versioned production copy.
 const nativeLength=graph[ref].inputs.length;let durationNode:string|undefined;let sourceFrames=typeof nativeLength==='number'?nativeLength:0;
 if(Array.isArray(nativeLength)&&typeof nativeLength[0]==='string'){
  const expression=graph[nativeLength[0]];
  if(expression?.class_type==='ComfyMathExpression'&&expression.inputs.expression?.replace(/\s/g,'')==='max(5,round(a*24))+(5-(max(5,round(a*24))%17))%17'){
   const durationLink=expression.inputs['values.a'];const primitive=Array.isArray(durationLink)?graph[durationLink[0]]:undefined;
   if(primitive?.class_type==='PrimitiveFloat'&&typeof primitive.inputs.value==='number'&&primitive.inputs.value>0){durationNode=durationLink[0];sourceFrames=h3FramesForDuration(primitive.inputs.value);}
  }
 }
 const widthLink=graph[ref].inputs.width;const sizeSelector=Array.isArray(widthLink)?graph[widthLink[0]]:undefined;
 const selectorId=Array.isArray(widthLink)&&sizeSelector?.class_type==='ResolutionSelector'?widthLink[0]:undefined;
 const megapixels=selectorId&&sizeSelector&&typeof sizeSelector.inputs.megapixels==='number'?sizeSelector.inputs.megapixels:undefined;
 if(!Number.isInteger(sourceFrames)||sourceFrames<5||sourceFrames>liveLength.max||(sourceFrames-5)%17!==0)throw Error('Unsupported or out-of-range H3 source duration/frame expression; inspect the workflow');
 const minFrames=5+17*Math.max(0,Math.ceil(((liveLength.min??5)-5)/17));
 const maxSeconds=sourceFrames/24;if(sourceFrames<minFrames)throw Error('Source duration is below the live frame minimum');
 graph[ref].inputs.prompt='Production prompt is bound per job.';
 if(!Array.isArray(graph[ref].inputs.width))graph[ref].inputs.width=576;
 if(!Array.isArray(graph[ref].inputs.height))graph[ref].inputs.height=1024;
 if(!durationNode)graph[ref].inputs.length=sourceFrames;
 for(const key of Object.keys(graph[ref].inputs))if(/^(ref_images|ref_videos|ref_video_audios|ref_audios)\./.test(key))delete graph[ref].inputs[key];
 if(graph[video].inputs.fps!==24)throw Error('H3 registration supports only the inspected 24 FPS frame policy');
 graph[save].inputs.filename_prefix=`video/studio-H3-${variant}`;
 const copy=pruneGraph(graph,[save]);await validateGraph(s,copy);
 const workflowName=path.basename(source,path.extname(source)).replace(/[^A-Za-z0-9_.-]+/g,'-');
 const file=path.join(root,'generation/workflows',`${variant}-${workflowName}.api.json`);await atomic(file,copy);
 const cfg={path:file,bindings:{prompt:{node:ref,input:'prompt'},width:selectorId?{node:selectorId,input:'aspect_ratio'}:{node:ref,input:'width'},height:selectorId?{node:selectorId,input:'megapixels'}:{node:ref,input:'height'},...(durationNode?{duration:{node:durationNode,input:'value'} }:{frames:{node:ref,input:'length'}}),seed:{node:sampler,input:seedInput},fps:{node:video,input:'fps'},save:{node:save,input:'filename_prefix'}},verified:true,minSeconds:minFrames/24,maxSeconds,resolutionMegapixels:megapixels,workflowName,sha256:await fileSha(file),referenceNode:ref,maxReferences:max,framePolicy:'h3-17n5' as const,evidence:`Live nodes/models and native 17*n+5 at 24 FPS checked. Operating ceiling ${maxSeconds}s comes from source frames (${sourceFrames}), bounded by live node limits; not a universal model maximum or a render quality/VRAM claim. Source: ${source}`};
 s.config.comfy.apiWorkflows[variant==='fast-ref'?'comfy-h3-fast-ref':variant==='motion'?'comfy-h3-motion':'comfy-h3-ref2v']=cfg;return cfg;
}
async function prepareH3(root:string,s:State,job:GenerationJob){
 const p=job.package,cfg=s.config.comfy.apiWorkflows[p.adapter];
 if(!cfg?.verified||!cfg.referenceNode||!cfg.sha256||await fileSha(cfg.path)!==cfg.sha256)throw Error('H3 workflow is unverified or changed; re-register');
 const graph:Graph=await json(cfg.path);const ref=graph[cfg.referenceNode];
 if(ref?.class_type!=='MiniMaxH3ReferenceToVideo'||!p.referencePlan||!p.references.length||p.references.length>(cfg.maxReferences??0))throw Error('Invalid H3 references or binding');
 if(p.durationSeconds>cfg.maxSeconds)throw Error(`H3 workflow maximum is ${cfg.maxSeconds} seconds per generated video`);
 if(p.references.some(r=>r.role==='end'))throw Error('Literal last-frame binding is not verified in this H3 reference adapter');
 const values:Record<string,unknown>={prompt:p.prompt,...(cfg.bindings.negative?{negative:p.negative}:{}),...(cfg.bindings.duration?{duration:p.durationSeconds}:{frames:Math.round(p.durationSeconds*24)}),width:p.width,height:p.height,seed:p.seed,fps:p.fps,save:`video/studio-${s.project.id}/${job.id}`};
 const resolutionNode=cfg.bindings.width?.node===cfg.bindings.height?.node&&graph[cfg.bindings.width.node]?.class_type==='ResolutionSelector'?cfg.bindings.width.node:undefined;
 for(const key of Object.keys(values)){const b=cfg.bindings[key];if(!b||!graph[b.node]||!(b.input in graph[b.node].inputs))throw Error(`Missing H3 binding: ${key}`);if(resolutionNode&&['width','height'].includes(key))continue;graph[b.node].inputs[b.input]=values[key];}
 if(resolutionNode){const ratio=p.width/p.height;const aspect=ratio<0.64?'9:16 (Portrait Widescreen)':ratio<0.8?'3:4 (Portrait Standard)':ratio<0.9?'2:3 (Portrait Photo)':ratio<1.1?'1:1 (Square)':ratio<1.5?'4:3 (Standard)':ratio<2?'16:9 (Widescreen)':'21:9 (Ultrawide)';const node=graph[resolutionNode];node.inputs[cfg.bindings.width.input]=aspect;node.inputs[cfg.bindings.height.input]=cfg.resolutionMegapixels??Number((p.width*p.height/1_000_000).toFixed(1));}
 for(const [index,r] of p.references.entries()){
  const folder=`productions/studio-${s.project.id}/${job.id}`;const filename=`${r.id}-v${r.version}${path.extname(r.file)}`;
  await mkdir(path.join(s.config.comfy.root,'input',folder),{recursive:true});await copyFile(inside(root,r.file),path.join(s.config.comfy.root,'input',folder,filename));
  const id=`studio-reference-${index+1}`;graph[id]={class_type:'LoadImage',inputs:{image:`${folder}/${filename}`}};
  ref.inputs[`ref_images.ref_image_${index}`]=[id,0];
 }
 await validateGraph(s,graph);await atomic(graphFile(root,job),graph);await atomic(path.join(root,'generation',job.id,'input-usage.json'),auditWorkflowInputs(graph,cfg,p));
}
async function executeComfy(root:string,s:State,job:GenerationJob,checkpoint:()=>Promise<void>){
 if(!job.remoteId){const queue=await getJSON(s,'/queue');const queued=[...(queue.queue_running??[]),...(queue.queue_pending??[])];const foreign=queued.filter((entry:any)=>!String(entry?.[3]?.client_id??'').startsWith('studio-JOB-'));if(foreign.length)throw Error('ComfyUI queue occupied by non-studio work; existing work preserved. Resume when free.');
  // Set uncertain before POST. A transport failure may still have enqueued work: never retry it blindly.
  job.state='uncertain';await checkpoint();const graph=await json(graphFile(root,job));const r=await fetch(s.config.comfy.url+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:graph,client_id:`studio-${job.id}`}),signal:AbortSignal.timeout(120000)});
  const data:any=await r.json();if(!r.ok||!data.prompt_id){job.state='failed';throw Error(`Comfy validation rejected: ${JSON.stringify(data)}`);}job.remoteId=data.prompt_id;job.state='running';await checkpoint();
  if(s.config.completionMode==='submit')return;
 }
 const deadline=Date.now()+s.config.timeoutMs;
 while(Date.now()<deadline){const h=(await getJSON(s,`/history/${job.remoteId}`))[job.remoteId!];if(h){await atomic(path.join(root,'generation',job.id,'history.json'),h);if(h.status?.status_str==='error'){job.state='failed';throw Error(`Comfy execution failed: ${JSON.stringify(h.status.messages).slice(-3000)}`);}if(h.status?.completed){
   const outputs=Object.values(h.outputs??{}) as any[];const media=outputs.flatMap(o=>o.videos??o.images??o.gifs??[]).find(x=>/\.(mp4|webm|mov)$/i.test(x.filename));if(!media)throw Error('Completed graph has no video output');
   const source=inside(path.join(s.config.comfy.root,media.type==='temp'?'temp':'output'),path.join(media.subfolder??'',media.filename));if(!await exists(source))throw Error(`Comfy output missing: ${source}`);const dest=path.join(root,'media',`${job.id}${path.extname(source)}`);await mkdir(path.dirname(dest),{recursive:true});await copyFile(source,dest);return path.relative(root,dest);
  }}await new Promise(r=>setTimeout(r,s.config.pollMs));}
 throw Error(`Observation timeout; remote ${job.remoteId} remains resumable. Do not resubmit.`);
}
export function adapter(id:string):Adapter{
 const cap=capabilities[id];if(!cap)throw Error(`Unknown adapter ${id}`);
 return {capabilities:cap,prepare:async(root,s,j,options)=>{await atomic(path.join(root,'generation',j.id,'prompt.json'),j.package);if(id==='msr')await prepareMSR(root,s,j);else if(['comfy-h3-ref2v','comfy-h3-fast-ref','comfy-h3-motion'].includes(id))await prepareH3(root,s,j);else if(id.startsWith('comfy-'))await prepareGeneric(root,s,j,!!options?.prepareOnly);else if(['seedance','kling'].includes(id))await atomic(path.join(root,'requests',`${j.id}-provider.json`),{jobId:j.id,provider:id,state:'prepared-not-submitted',package:j.package,instructions:'Codex must inspect the connected platform, translate the neutral brief to its actual syntax, upload supported references, estimate exact cost, verify human paid approval and episode/project budget, then submit through its connector. Record remoteId immediately using studio jobs --bind-remote. Register local result with studio generate --receive. CLI cannot call desktop MCP tools directly.'});},
 execute:async(root,s,j,checkpoint)=>{if(id==='mock'){const file=path.join(root,'media',`${j.id}.SIMULATED.mp4`);await simulatedVideo(file,j.package,s.config);return path.relative(root,file);}if(['seedance','kling'].includes(id)){j.state='blocked';throw Error('Codex MCP handoff prepared; external generation requires explicit paid approval and connector execution.');}return executeComfy(root,s,j,checkpoint);}};
}
