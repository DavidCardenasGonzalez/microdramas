import { mkdir, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { type State, type GenerationJob } from './contracts.js';
import { latest, sha, now, uid, save, dep, base, fileSha, atomic, inside, diagnostic } from './store.js';
import { scoped, type Scope } from './planning.js';
import { adapter, compile, capabilities } from './adapters.js';
export async function enqueue(root:string,s:State,provider:string,scope:Scope={},options:{alternative?:boolean;correction?:string;seed?:number;estimate?:number}={}){
 const shots=scoped(latest(s.shots),scope);if(!shots.length)throw Error('No active shots in requested scope');const made:GenerationJob[]=[];
 for(const shot of shots){const pack=await compile(root,s,shot,provider,options.correction,options.seed??42);const fingerprint=sha(JSON.stringify(pack));
  const existing=s.jobs.find(x=>x.fingerprint===fingerprint&&x.state!=='stale'&&x.state!=='failed');if(existing&&!options.alternative)continue;
  const paid=capabilities[provider].paid;const estimate=options.estimate??0;
  const j:GenerationJob={id:uid('JOB'),shotId:shot.id,shotVersion:shot.version,episodeId:shot.episodeId,sceneId:shot.sceneId,package:pack,fingerprint,state:'queued',attempts:0,maxAttempts:s.config.maxAttempts,estimate,paid,reserved:false,createdAt:now(),updatedAt:now()};
  s.jobs.push(j);made.push(j);
 }
 return made;
}
export const jobScopeHash=(jobs:GenerationJob[])=>sha(JSON.stringify(jobs.map(j=>({id:j.id,fingerprint:j.fingerprint,estimate:j.estimate,paid:j.paid})).sort((a,b)=>a.id.localeCompare(b.id))));
export function approveJobs(s:State,scope:Scope,options:{local:boolean;paid:boolean;maxCost:number;reason:string;hours?:number}){
 const jobs=scoped(s.jobs,scope).filter(j=>!['succeeded','stale'].includes(j.state));if(!jobs.length)throw Error('No pending jobs');
 if(jobs.some(j=>j.paid&&(!options.paid||j.estimate<=0)))throw Error('Paid jobs require a positive provider cost estimate and --paid');
 const total=jobs.reduce((n,j)=>n+j.estimate,0);if(total>options.maxCost||total>s.config.budget)throw Error(`Estimated cost ${total} exceeds approval/project budget`);
 const a={id:uid('APPROVAL'),scopeHash:jobScopeHash(jobs),jobIds:jobs.map(j=>j.id),expiresAt:new Date(Date.now()+(options.hours??24)*3600000).toISOString(),maxCost:options.maxCost,maxJobs:jobs.length,usedJobs:0,spent:0,allowPaid:options.paid,allowLocal:options.local,reason:options.reason};s.approvals.push(a);return a;
}
function authorize(s:State,j:GenerationJob,token:string|undefined,jobs:GenerationJob[]){if(j.package.simulated)return;
 const a=s.approvals.find(a=>a.id===token);if(!a)throw Error('Real execution requires a scoped approval token: studio approve --local / --paid');
 if(Date.parse(a.expiresAt)<Date.now())throw Error('Approval expired');
 const authorizedJobs=s.jobs.filter(x=>a.jobIds.includes(x.id));
 if(!a.jobIds.includes(j.id)||a.scopeHash!==jobScopeHash(authorizedJobs))throw Error('Approval scope changed; approve the current jobs');
 if(j.paid&&!a.allowPaid||!j.paid&&!a.allowLocal)throw Error('Approval does not authorize this resource type');
 if(!j.reserved){const spent=s.approvals.reduce((n,a)=>n+a.spent,0);if(a.usedJobs>=a.maxJobs||a.spent+j.estimate>a.maxCost||spent+j.estimate>s.config.budget)throw Error('Resource budget exhausted');a.usedJobs++;a.spent+=j.estimate;j.reserved=true;}
}
export async function executeQueue(root:string,s:State,scope:Scope={},token?:string,options:{prepareOnly?:boolean}={}){
 for(const j of scoped(s.jobs,scope).filter(j=>j.state==='succeeded')){try{const take=s.takes.find(t=>t.jobId===j.id&&t.status!=='stale');if(!take||await fileSha(inside(root,take.file))!==take.sha256)throw Error('Missing or changed successful output');}catch{j.state='blocked';j.error='Successful output missing or changed. Restore the original file or create a new alternative; it will not be regenerated silently.';}}
 const candidates=scoped(s.jobs,scope).filter(j=>!['succeeded','stale'].includes(j.state)&&!(j.state==='failed'&&j.remoteId));
 // Approval covers the original job list including successful jobs for safe partial resume.
 const approval=s.approvals.find(x=>x.id===token);const scopeJobs=scoped(s.jobs,scope).filter(j=>j.state!=='stale');
 let approvalJobs=candidates;if(approval&&approval.scopeHash===jobScopeHash(scopeJobs))approvalJobs=scopeJobs;
 let writes=Promise.resolve();const checkpoint=()=>{writes=writes.then(()=>save(root,s));return writes;};
 const run=async(j:GenerationJob)=>{
  if(j.state==='blocked'&&j.error?.startsWith('Successful output'))return;
  if(j.state==='uncertain'&&!j.remoteId){diagnostic(s,'generate',`Uncertain submission ${j.id}`,'Inspect ComfyUI queue/history and bind the known prompt_id; do not blindly retry.',j.shotId);return;}
  if(j.attempts>=j.maxAttempts&&!j.remoteId){j.state='failed';j.error='Retry limit reached; create a corrected alternative explicitly.';return;}
  try{if(sha(JSON.stringify(j.package))!==j.fingerprint)throw Error('Job package integrity changed; create an explicit alternative');const a=adapter(j.package.adapter);if(!j.remoteId)await a.prepare(root,s,j);if(options.prepareOnly)return;
   if(!j.remoteId||!j.reserved)authorize(s,j,token,approvalJobs);
   if(!j.remoteId){j.attempts++;j.state='running';}j.updatedAt=now();await checkpoint();
   const file=await a.execute(root,s,j,checkpoint);await registerTake(root,s,j,file);await checkpoint();
  }catch(e){if(!['uncertain','blocked','failed'].includes(j.state))j.state=j.remoteId?'running':'failed';j.error=(e as Error).message;j.updatedAt=now();diagnostic(s,'generate',`${j.id}: ${j.error}`,'Resolve the reported issue, then resume with the same remote ID; use an alternative for a changed prompt.',j.shotId);await checkpoint();}
 };
 // ComfyUI uses one GPU; never parallelize local model jobs even if mock concurrency is raised.
 const local=candidates.filter(j=>!j.package.simulated);for(const j of local)await run(j);
 const mock=candidates.filter(j=>j.package.simulated);let cursor=0;await Promise.all(Array.from({length:Math.min(s.config.concurrency,mock.length)},async()=>{while(cursor<mock.length)await run(mock[cursor++]);}));
 return candidates.map(j=>({id:j.id,state:j.state,error:j.error}));
}
export async function registerTake(root:string,s:State,j:GenerationJob,file:string){
 const resolved=inside(root,file);const hash=await fileSha(resolved);const existing=s.takes.find(t=>t.jobId===j.id&&t.sha256===hash);if(existing){j.state='succeeded';j.output=file;return existing;}
 const take={...base(uid('TAKE'),[{id:j.shotId,version:j.shotVersion},...j.package.references.map(r=>({id:r.id,version:r.version}))]),status:'pending' as const,shotId:j.shotId,jobId:j.id,file,sha256:hash,simulated:j.package.simulated,technical:'pending' as const,audiovisual:'pending' as const};s.takes.push(take);j.state='succeeded';j.error=undefined;j.output=file;j.updatedAt=now();
 const shot=latest(s.shots).find(x=>x.id===j.shotId);if(shot)shot.finalState='generated';return take;
}
export async function receiveTake(root:string,s:State,jobId:string,file:string,remoteId?:string){const j=s.jobs.find(x=>x.id===jobId);if(!j||j.state==='stale')throw Error('Unknown or stale job');if(!j.reserved&&!j.package.simulated)throw Error('Generation must be authorized before receiving a real job result');if(j.paid&&!remoteId&&!j.remoteId)throw Error('Provider job ID is required for paid provenance');if(remoteId)j.remoteId=remoteId;const dest=path.join(root,'media',`${j.id}${path.extname(file)}`);await mkdir(path.dirname(dest),{recursive:true});if(path.resolve(dest)!==path.resolve(file))await copyFile(file,dest);return registerTake(root,s,j,path.relative(root,dest));}
