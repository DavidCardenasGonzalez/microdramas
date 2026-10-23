import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import * as C from './contracts.js';
import { defaultConfig, profiles } from './profiles.js';
import { atomic, base, exists, now, latest, json, uid, fileSha, inside } from './store.js';
import { repository } from './narrative.js';
import { validateShot, validateSource } from './planning.js';
import { findFFmpeg, command } from './media.js';
export async function init(root:string,title:string,profileName:string,profileFile?:string){
 if(await exists(path.join(root,'.studio/state.json')))throw Error('Existing project preserved; use its path or choose a new folder');
 const profile=C.Profile.parse(profileFile?await json(profileFile):profiles[profileName]);
 const state=C.State.parse({schemaVersion:1,revision:0,project:{...base(uid('PROJECT')),status:'approved',title,profile,createdAt:now()},config:defaultConfig(),brief:'',bibles:[],characters:[],episodes:[],scripts:[],scenes:[],beats:[],shots:[],assets:[],references:[],jobs:[],takes:[],reviews:[],timelines:[],exports:[],approvals:[],diagnostics:[]});
 await mkdir(path.join(root,'.studio'),{recursive:true});await atomic(path.join(root,'.studio/state.json'),state);return state;
}
export function progress(s:C.State){
 const activeShots=latest(s.shots),activeTakes=latest(s.takes),exports=latest(s.exports);const selected=activeShots.filter(x=>x.selectedTakeId).length;
 const activeJobs=s.jobs.filter(x=>x.state!=='stale'),activeRefs=latest(s.references);
 const stages={write:s.scripts.some(x=>x.status==='approved')?'complete':s.brief?'pending':'not-started',plan:activeShots.length?activeShots.every(x=>x.status==='approved')?'complete':'pending':'not-started',references:activeRefs.length?activeRefs.every(x=>x.status==='approved')?'complete':s.referenceJobs.some(x=>x.state==='failed')?'blocked':'pending':'not-started',generate:activeJobs.length?activeJobs.every(x=>x.state==='succeeded')?'complete':activeJobs.some(x=>['blocked','uncertain','failed'].includes(x.state))?'blocked':'pending':'not-started',review:activeShots.length&&selected===activeShots.length?'complete':activeTakes.length?'pending':'not-started',edit:latest(s.timelines).some(x=>x.status==='approved')?'complete':'pending',export:exports.length?exports.some(x=>x.quality==='approved')?'complete':exports.some(x=>x.simulated)?'simulated':'pending':'pending'};
 return {project:s.project.title,revision:s.revision,stages,counts:{episodes:s.episodes.length,configuredEpisodes:s.project.profile.episodes,scripts:s.scripts.length,scenes:latest(s.scenes).length,beats:latest(s.beats).length,shots:activeShots.length,references:activeRefs.length,jobs:s.jobs.length,takes:activeTakes.length,selected,exports:exports.length},referenceJobs:s.referenceJobs,jobs:s.jobs.map(j=>({id:j.id,shotId:j.shotId,state:j.state,remoteId:j.remoteId,error:j.error,simulated:j.package.simulated})),diagnostics:s.diagnostics,exports};
}
export async function validateProject(root:string,s:C.State){C.State.parse(s);const lists=[s.bibles,s.characters,s.episodes,s.scripts,s.scenes,s.beats,s.shots,s.assets,s.references,s.takes,s.reviews,s.timelines,s.exports];const keys=new Set<string>();for(const list of lists)for(const x of list){const key=`${x.id}@${x.version}`;if(keys.has(key))throw Error(`Duplicate artifact version ${key}`);keys.add(key);}
 const universe=new Set([...keys,`${s.project.id}@${s.project.version}`]);for(const list of lists)for(const x of list)for(const d of x.deps)if(!universe.has(`${d.id}@${d.version}`))throw Error(`Missing dependency ${d.id}@${d.version} for ${x.id}`);
 for(const script of s.scripts){const snapshot=path.join(root,'narrative',`${script.id}.v${script.version}.fountain`);if(!await exists(snapshot)||await fileSha(snapshot)!==script.sha256)throw Error(`Narrative snapshot integrity mismatch ${script.id} v${script.version}`);}
 for(const sc of s.scenes)validateSource(s,sc.source);for(const beat of s.beats)validateSource(s,beat.source);for(const shot of latest(s.shots))validateShot(s,shot);
 for(const r of latest(s.references).filter(x=>x.file)){if(await fileSha(inside(root,r.file!))!==r.sha256)throw Error(`Reference integrity mismatch ${r.id}`);}
 for(const take of latest(s.takes)){if(await fileSha(inside(root,take.file))!==take.sha256)throw Error(`Take integrity mismatch ${take.id}`);}
 for(const job of s.jobs){if(!s.shots.some(x=>x.id===job.shotId&&x.version===job.shotVersion))throw Error(`Orphaned job ${job.id}`);const {sha}=await import('./store.js');if(sha(JSON.stringify(job.package))!==job.fingerprint)throw Error(`Job package integrity mismatch ${job.id}`);}
 return {valid:true,artifacts:keys.size,sourceSpans:s.scenes.length+s.beats.length};
}
export async function emitSchemas(){for(const name of ['Project','StoryBible','Character','Episode','Script','Scene','Beat','Shot','Asset','Reference','GenerationJob','GeneratedTake','Review','Timeline','Export','NarrativeResult','State','Config','Profile','PromptPackage','Approval','ReferenceGeneration','Diagnostic'] as const){const schema=z.toJSONSchema(C[name],{unrepresentable:'any'});const file=name==='NarrativeResult'?'narrative-result':name;await atomic(path.join(repository,'schemas',`${file}.schema.json`),schema);}}
export async function doctor(config:C.Config,smoke=false){
 const files={msrRunner:config.comfy.msrRunner,msrBase:config.comfy.msrBase,fluxBase:config.comfy.fluxBase,python:config.comfy.python,i2vCanvas:path.join(config.comfy.root,'user/default/workflows/video_ltx2_5_i2v.json'),flfCanvas:path.join(config.comfy.root,'user/default/workflows/video_ltx2_5_flf2v.json'),directorApi:path.join(config.comfy.root,'user/director_quality/prompt_quality.json')};const inventory:any={node:process.version,files:[],comfy:{reachable:false},ffmpeg:undefined,ffprobe:config.ffprobe??'not configured: FFmpeg metadata fallback',higgsfield:'Available in Codex session; not directly callable from standalone CLI'};
 for(const [name,file] of Object.entries(files)){inventory.files.push({name,file,exists:file?await exists(file):false,sha256:file&&await exists(file)?await fileSha(file):undefined});}
 try{inventory.ffmpeg=await findFFmpeg(config);}catch(e){inventory.ffmpeg=(e as Error).message;}
 try{const req=async(ep:string)=>{const r=await fetch(config.comfy.url+ep,{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error(`${ep}: ${r.status}`);return r.json() as Promise<any>;};const [stats,queue]=await Promise.all([req('/system_stats'),req('/queue')]);inventory.comfy={reachable:true,url:config.comfy.url,version:stats.system?.comfyui_version,devices:stats.devices?.map((d:any)=>({name:d.name,vram_total:d.vram_total,vram_free:d.vram_free})),queue};
  if(smoke){if(queue.queue_running?.length||queue.queue_pending?.length)throw Error('Queue occupied; smoke not submitted');const prefix=`studio-smoke/${uid('image')}`;const workflow={'1':{class_type:'EmptyImage',inputs:{width:32,height:32,batch_size:1,color:0x254060}},'2':{class_type:'SaveImage',inputs:{images:['1',0],filename_prefix:prefix}}};const res=await fetch(config.comfy.url+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:workflow,client_id:'studio-doctor'}),signal:AbortSignal.timeout(10000)});const submitted:any=await res.json();if(!res.ok||!submitted.prompt_id)throw Error(JSON.stringify(submitted));inventory.smoke={promptId:submitted.prompt_id,type:'real-backend-io-only; no generative model, no GPU claim',state:'running'};for(let i=0;i<30;i++){const h=(await req(`/history/${submitted.prompt_id}`))[submitted.prompt_id];if(h?.status?.completed){inventory.smoke.state='succeeded';inventory.smoke.output=h.outputs;break;}if(h?.status?.status_str==='error')throw Error(JSON.stringify(h.status));await new Promise(r=>setTimeout(r,500));}}
 }catch(e){inventory.comfy.error=(e as Error).message;}
 return inventory;
}
