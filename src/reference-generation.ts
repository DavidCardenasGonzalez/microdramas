import path from 'node:path';
import { mkdir, copyFile } from 'node:fs/promises';
import { type State } from './contracts.js';
import { latest, fileSha, json, uid, now, sha, atomic, save, inside } from './store.js';
import { cinematicOpening } from './cinematography.js';
import { validateGraph, pruneGraph } from './adapters.js';
import { command, findFFmpeg } from './media.js';
/** FLUX uses the installed API template and models. No workflow master is altered. */
export async function generateReference(root:string,s:State,id:string,options:{source?:string;prompt?:string;execute?:boolean;approveLocal?:boolean;retry?:boolean;resumeJobId?:string}={}){
 const ref=latest(s.references).find(r=>r.id===id);if(!ref)throw Error('Prepare a reference inventory first');if(ref.status==='approved'&&options.execute)throw Error('Reference already approved; create an explicit revision before regeneration');
 if(!options.resumeJobId&&!latest(s.cinematicStyles).some(x=>x.status==='approved'))throw Error('Import a concrete production CinematicStyle with cinematic-style --import before generating new reference images; existing remote jobs remain resumable');
 const template=s.config.comfy.fluxBase;if(!template)throw Error('Configure comfy.fluxBase');const templateHash=await fileSha(template);const source=options.source?path.resolve(options.source):undefined;const sourceHash=source?await fileSha(source):undefined;
 if(sourceHash&&s.references.some(r=>r.simulated&&r.sha256===sourceHash))throw Error('Simulated source cannot condition a real generation');
 const prompt=options.resumeJobId?(s.referenceJobs.find(j=>j.id===options.resumeJobId)?.prompt??''):`${cinematicOpening(s)}\n\nProduction reference image. ${options.prompt??`${ref.description}. ${ref.purpose}. One coherent image, no text or watermark.`}`;
 const fingerprint=sha(JSON.stringify({id,version:ref.version,prompt,sourceHash,templateHash,width:s.project.profile.width,height:s.project.profile.height}));let job=options.resumeJobId?s.referenceJobs.find(j=>j.id===options.resumeJobId):s.referenceJobs.find(j=>j.fingerprint===fingerprint);if(options.resumeJobId&&(!job||job.targetId!==ref.id||job.targetVersion!==ref.version))throw Error('Cannot resume stale reference version');
 if(job?.state==='succeeded')return job;
 if(job?.state==='uncertain'&&!job.remoteId)throw Error(`Reference submission uncertain (${job.id}); inspect backend and bind its remote ID with jobs --reference --job ${job.id}`);
 if(!job){job={id:uid('REFJOB'),targetId:ref.id,targetVersion:ref.version,fingerprint,prompt,source,sourceSha256:sourceHash,templateSha256:templateHash,graphFile:'',authorized:false,state:'prepared',attempts:0,createdAt:now(),updatedAt:now()};s.referenceJobs.push(job);}
 if(job.attempts>=s.config.maxAttempts&&!job.remoteId)throw Error('Reference retry limit reached; make a corrected request');
 let finalGraph:any;
 if(job.remoteId){finalGraph=await json(inside(root,job.graphFile));}else{
 const graph=await json(template);if(graph.nodes||!graph['4']||!graph['44']||!graph['9']||!graph['7'])throw Error('FLUX template changed; re-inspect bindings');
 if(s.project.profile.width%16||s.project.profile.height%16)throw Error('FLUX dimensions must be multiples of 16');
 graph['44'].inputs.width=s.project.profile.width;graph['44'].inputs.height=s.project.profile.height;graph['9'].inputs.filename_prefix=`studio-${s.project.id}/references/${job.id}`;
 if(source){if(!graph['11']||!graph['47'])throw Error('Missing FLUX reference/expander bindings');const folder=`productions/studio-${s.project.id}/references`;const file=`${job.id}${path.extname(source)}`;await mkdir(path.join(s.config.comfy.root,'input',folder),{recursive:true});await copyFile(source,path.join(s.config.comfy.root,'input',folder,file));graph['11'].inputs.image=`${folder}/${file}`;graph['47'].inputs.prompt=prompt;}
 else{ // Text-only path: retain installed sampler/model/VAE, bypass image conditioning and image-edit upsampler.
  graph['4'].inputs.text=prompt;graph['7'].inputs.positive=['4',0];graph['7'].inputs.negative=['32',0];
 }
 finalGraph=pruneGraph(graph,['9']);job.graphFile=path.join('generation',job.id,'workflow.api.json');await atomic(inside(root,job.graphFile),finalGraph);try{await validateGraph(s,finalGraph);}catch(e){job.state='failed';job.error=(e as Error).message;job.updatedAt=now();await save(root,s);return job;}
 await atomic(path.join(root,'generation',job.id,'provenance.json'),{template,templateHash,mode:source?'image-to-image':'text-to-image',bindingChanges:source?'11.image,47.prompt,44 dimensions,9 prefix':'4.text,7 positive/negative direct; prune image conditioning and upsampler;44 dimensions;9 prefix',prompt,source,sourceHash});}
 if(!options.execute)return job;if(options.approveLocal)job.authorized=true;if(!job.authorized)throw Error('Reference model execution requires --execute --approve-local; preparation itself is free');if(job.state==='failed'&&!options.retry)throw Error('Reference failed; inspect the recorded error, then use --retry explicitly');
 const request=async(endpoint:string)=>{const r=await fetch(s.config.comfy.url+endpoint,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error(`Comfy ${endpoint}: ${r.status}`);return r.json() as Promise<any>;};
 try{
  if(!job.remoteId){const q=await request('/queue');if(q.queue_running?.length||q.queue_pending?.length)throw Error('ComfyUI queue occupied; preserve existing work');job.attempts++;job.state='uncertain';await save(root,s);const r=await fetch(s.config.comfy.url+'/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:finalGraph,client_id:`studio-${job.id}`}),signal:AbortSignal.timeout(120000)});const data:any=await r.json();if(!r.ok||!data.prompt_id){job.state='failed';throw Error(`Reference graph rejected: ${JSON.stringify(data)}`);}job.remoteId=data.prompt_id;job.state='running';await save(root,s);}
  const deadline=Date.now()+s.config.timeoutMs;
  while(Date.now()<deadline){const history=(await request(`/history/${job.remoteId}`))[job.remoteId!];if(history){await atomic(path.join(root,'generation',job.id,'history.json'),history);if(history.status?.status_str==='error'){job.state='failed';throw Error(JSON.stringify(history.status.messages).slice(-3000));}if(history.status?.completed){const item=history.outputs?.['9']?.images?.[0];if(!item)throw Error('No SaveImage result');const output=inside(path.join(s.config.comfy.root,'output'),path.join(item.subfolder??'',item.filename));const candidate=path.join('references','candidates',`${job.id}${path.extname(output)}`);await mkdir(path.dirname(inside(root,candidate)),{recursive:true});await copyFile(output,inside(root,candidate));await command(await findFFmpeg(s.config),['-v','error','-i',inside(root,candidate),'-f','null','-']);job.output=candidate;job.state='succeeded';job.error=undefined;job.updatedAt=now();await save(root,s);return job;}}
   await new Promise(r=>setTimeout(r,s.config.pollMs));
  }throw Error('Reference observation timeout; resume using same request/remote ID');
 }catch(e){job.error=(e as Error).message;job.updatedAt=now();if(job.state!=='uncertain'&&job.state!=='running')job.state='failed';await save(root,s);return job;}
}
