import { mkdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { type State, type GenerationJob, PromptPackage as PackageSchema, type PromptPackage, type Shot } from './contracts.js';
import { dep, latest, fileSha, json, atomic, inside, exists } from './store.js';
import { command, simulatedVideo } from './media.js';
import { validateShot } from './planning.js';
import { repository } from './narrative.js';
export type Capabilities={id:string;paid:boolean;strategies:string[];minSeconds:number;maxSeconds:number;execution:'local'|'codex-bridge';verified:string};
export interface Adapter {capabilities:Capabilities;prepare(root:string,s:State,job:GenerationJob):Promise<void>;execute(root:string,s:State,job:GenerationJob,checkpoint:()=>Promise<void>):Promise<string>;}
export const capabilities:Record<string,Capabilities>={
 mock:{id:'mock',paid:false,strategies:['reference-video','i2v','flf2v','t2v'],minSeconds:1,maxSeconds:30,execution:'local',verified:'synthetic FFmpeg fixture; never real footage'},
 msr:{id:'msr',paid:false,strategies:['reference-video'],minSeconds:1,maxSeconds:15,execution:'local',verified:'existing runner + API base; doctor checks live nodes'},
 'comfy-i2v':{id:'comfy-i2v',paid:false,strategies:['i2v'],minSeconds:0,maxSeconds:0,execution:'local',verified:'duration unknown until configured; requires a verified flat API export'},
 'comfy-flf2v':{id:'comfy-flf2v',paid:false,strategies:['flf2v'],minSeconds:0,maxSeconds:0,execution:'local',verified:'duration unknown until configured; requires a verified flat API export'},
 seedance:{id:'seedance',paid:true,strategies:['reference-video','i2v','flf2v','t2v'],minSeconds:4,maxSeconds:15,execution:'codex-bridge',verified:'Higgsfield models_search: seedance_2_0; submit only through Codex MCP with cost approval'}
};
export async function compile(root:string,s:State,shot:Shot,adapterId:string,override?:string,seed=42):Promise<PromptPackage>{
 let cap=capabilities[adapterId];if(!cap)throw Error(`Unknown adapter ${adapterId}`);if(adapterId.startsWith('comfy-')){const cfg=s.config.comfy.apiWorkflows[adapterId];if(!cfg?.verified||cfg.maxSeconds<cfg.minSeconds)throw Error('Configure a verified API export with measured minSeconds/maxSeconds before compiling this adapter');cap={...cap,minSeconds:cfg.minSeconds,maxSeconds:cfg.maxSeconds};}validateShot(s,shot);if(shot.status!=='approved')throw Error(`Shot is not approved: ${shot.id}`);if(s.diagnostics.some(d=>d.stage==='plan'&&d.severity==='blocker'&&[shot.id,shot.sceneId,shot.episodeId].includes(d.targetId??'')))throw Error('Unresolved source/plan diagnostics block generation');
 if(!cap.strategies.includes(shot.strategy))throw Error(`${adapterId} cannot execute ${shot.strategy}`);
 if(adapterId==='seedance'&&s.config.bridge.model!=='seedance_2_0')throw Error('This adapter maps the verified seedance_2_0 contract only; register another model capability mapping before use');
 if(shot.durationSeconds<cap.minSeconds||shot.durationSeconds>cap.maxSeconds)throw Error(`Duration ${shot.durationSeconds}s unsupported by ${adapterId}; adjust shot planning explicitly.`);
 if(adapterId==='msr'&&(!((s.project.profile.width===720&&s.project.profile.height===1280)||(s.project.profile.width===1280&&s.project.profile.height===720))||s.project.profile.fps!==24))throw Error('Existing MSR runner requires 720x1280 or 1280x720 at 24 FPS');
 const references=[];
 for(const id of shot.referenceIds){const r=latest(s.references).find(x=>x.id===id);if(!r||r.status!=='approved'||!r.file||!r.sha256)throw Error(`Mandatory reference not approved: ${id}`);const file=inside(root,r.file);if(await fileSha(file)!==r.sha256)throw Error(`Reference changed outside versioning: ${id}`);if(adapterId!=='mock'&&r.simulated)throw Error(`Simulated reference cannot drive a real generation: ${id}`);references.push({id:r.id,version:r.version,role:r.kind,file:r.file,sha256:r.sha256});}
 if(shot.strategy==='t2v'&&shot.referenceIds.length)throw Error('T2V cannot silently ignore mandatory references');
 if(shot.strategy!=='t2v'&&!references.length)throw Error('Reference-conditioned generation requires references');
 if(['i2v','flf2v'].includes(shot.strategy)&&!references.some(r=>r.role==='start'))throw Error('Start frame required');
 if(shot.strategy==='flf2v'&&!references.some(r=>r.role==='end'))throw Error('End frame required');
 const beats=shot.beatIds.map(id=>latest(s.beats).find(b=>b.id===id)!);
 const context=shot.characterIds.map(id=>latest(s.characters).find(c=>c.id===id)).filter(x=>!!x).map(c=>`${c!.name}: ${c!.description}. Voice: ${c!.voice}`).join('\n');
 const literalDialogue=shot.dialogue.map(d=>`${latest(s.characters).find(c=>c.id===d.speakerId)?.name}: ${JSON.stringify(d.text)}`).join('\n');
 const prompt=[s.project.profile.style,context,`Framing: ${shot.framing}. Camera: ${shot.camera.position}; ${shot.camera.movement}; ${shot.camera.lens}; ${shot.camera.focus}.`,shot.blocking,`SOURCE ACTION / DIALOGUE (preserve verbatim):\n${beats.map(b=>b.source.quote).join('\n\n')}`,`Start: ${shot.startState}\nEnd: ${shot.endState}`,`Continuity: ${Object.values(shot.continuity).join('; ')}`,`Audio (${s.project.profile.language}${s.project.profile.languageLevel?' '+s.project.profile.languageLevel:''}): ${literalDialogue||'No dialogue.'} ${shot.sound.join('; ')}`,override?`Director correction (cannot change story): ${override}`:'','One physically continuous shot; no morphing, dissolve or unrequested cuts.'].filter(Boolean).join('\n\n');
 if(override&&/rewrite|replace dialogue|change dialogue/i.test(override))throw Error('Narrative corrections must return to Screenwriting');
 return PackageSchema.parse({adapter:adapterId,shotId:shot.id,shotVersion:shot.version,strategy:shot.strategy,prompt,negative:'unrequested dissolve, morphing, duplicated subjects, anatomy defects, text, watermark',references,durationSeconds:shot.durationSeconds,width:s.project.profile.width,height:s.project.profile.height,fps:s.project.profile.fps,seed,simulated:adapterId==='mock',parameters:adapterId==='seedance'?{model:s.config.bridge.model,resolution:'720p',mode:'std',generate_audio:true}: {}});
}
type Graph=Record<string,{class_type:string;inputs:Record<string,any>}>;
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
async function prepareGeneric(root:string,s:State,job:GenerationJob){const cfg=s.config.comfy.apiWorkflows[job.package.adapter];if(!cfg?.verified)throw Error('No verified API export configured. Export the actual canvas through ComfyUI frontend and configure bindings.');const graph:Graph=await json(cfg.path);if('nodes' in graph)throw Error('Canvas workflows are not executable API graphs');const p=job.package;
 const values:Record<string,unknown>={prompt:p.prompt,duration:p.durationSeconds,width:p.width,height:p.height,seed:p.seed,fps:p.fps,save:`video/studio-${s.project.id}/${job.id}`};
 for(const role of ['start','end']){const ref=p.references.find(r=>r.role===role);if(ref){const folder=`productions/studio-${s.project.id}`;const filename=`${ref.id}-v${ref.version}${path.extname(ref.file)}`;await mkdir(path.join(s.config.comfy.root,'input',folder),{recursive:true});await copyFile(inside(root,ref.file),path.join(s.config.comfy.root,'input',folder,filename));values[role]=`${folder}/${filename}`;}}
 for(const key of ['prompt','duration','width','height','seed','fps','save','start',...(p.strategy==='flf2v'?['end']:[])])if(!cfg.bindings[key])throw Error(`Missing explicit workflow binding: ${key}`);
 for(const [key,b] of Object.entries(cfg.bindings)){if(!(key in values))continue;if(!graph[b.node]?.inputs||!(b.input in graph[b.node].inputs))throw Error(`Invalid binding ${key}`);graph[b.node].inputs[b.input]=values[key];}
 await validateGraph(s,graph);await atomic(graphFile(root,job),graph);
}
async function executeComfy(root:string,s:State,job:GenerationJob,checkpoint:()=>Promise<void>){
 if(!job.remoteId){const queue=await getJSON(s,'/queue');if(queue.queue_running?.length||queue.queue_pending?.length)throw Error('ComfyUI queue occupied; existing work preserved. Resume when free.');
  // Set uncertain before POST. A transport failure may still have enqueued work: never retry it blindly.
  job.state='uncertain';await checkpoint();const graph=await json(graphFile(root,job));const r=await fetch(s.config.comfy.url+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:graph,client_id:`studio-${job.id}`}),signal:AbortSignal.timeout(120000)});
  const data:any=await r.json();if(!r.ok||!data.prompt_id){job.state='failed';throw Error(`Comfy validation rejected: ${JSON.stringify(data)}`);}job.remoteId=data.prompt_id;job.state='running';await checkpoint();
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
 return {capabilities:cap,prepare:async(root,s,j)=>{await atomic(path.join(root,'generation',j.id,'prompt.json'),j.package);if(id==='msr')await prepareMSR(root,s,j);else if(id.startsWith('comfy-'))await prepareGeneric(root,s,j);else if(id==='seedance')await atomic(path.join(root,'requests',`${j.id}-higgsfield.json`),{jobId:j.id,tool:'higgsfield.generate_video',state:'prepared-not-submitted',package:j.package,instructions:'Codex must upload approved references, estimate exact cost, verify approval scope and budget, then invoke MCP. Record remoteId immediately using studio jobs --bind-remote. Download only provider-returned source through authorized connector; register local result with studio generate --receive. CLI cannot call desktop MCP tools directly.'});},
 execute:async(root,s,j,checkpoint)=>{if(id==='mock'){const file=path.join(root,'media',`${j.id}.SIMULATED.mp4`);await simulatedVideo(file,j.package,s.config);return path.relative(root,file);}if(id==='seedance'){j.state='blocked';throw Error('Codex MCP handoff prepared; external generation requires explicit paid approval and connector execution.');}return executeComfy(root,s,j,checkpoint);}};
}
