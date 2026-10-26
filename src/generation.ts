import { mkdir, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { type State, type GenerationJob, type Shot, RecoveryDecision } from './contracts.js';
import { latest, sha, now, uid, save, dep, base, fileSha, atomic, inside, diagnostic } from './store.js';
import { scoped, type Scope } from './planning.js';
import { adapter, compile, capabilities } from './adapters.js';
import { routeAdapter, isOfficialH3 } from './hybrid.js';
export function retireUnsubmittedJob(s:State,id:string){
 const job=s.jobs.find(j=>j.id===id);if(!job)throw Error('Unknown job');
 if(job.remoteId||job.reserved||!['queued','failed','blocked'].includes(job.state))throw Error('Only an unsubmitted, unreserved job may be retired; preserve and observe known remote IDs');
 job.state='stale';job.error='Retired before submission; package and history preserved.';job.updatedAt=now();return job;
}
export function validateRecovery(s:State,shot:Shot,input:unknown){
 const r=RecoveryDecision.parse(input),from=s.jobs.find(j=>j.id===r.fromJobId&&j.shotId===shot.id);
 if(!from)throw Error('Recovery must cite an existing job of this shot');
 if(from.state==='uncertain'||(from.remoteId&&from.state==='running'))throw Error('Observe or resolve the existing remote ID before creating a recovery');
 if(['redirect','separate-audio','change-model'].includes(r.action)&&shot.version<=from.shotVersion)throw Error('Changed staging, audio strategy or model requires a newly imported directed Shot version');
 if(r.action==='change-model'&&routeAdapter(shot)===from.package.adapter)throw Error('Model recovery must change the directed adapter');
 if(r.action==='separate-audio'&&!shot.referencePlan?.dialogueStaging?.some(a=>a.strategy!=='on-camera'))throw Error('Separate-audio recovery requires an independent audio assignment');
 const previousAttributionRecoveries=s.jobs.filter(j=>j.shotId===shot.id&&(j.package.parameters.recovery as {category?:string}|undefined)?.category==='speaker-attribution'&&s.takes.some(t=>t.jobId===j.id&&t.audiovisual==='fail'));
 if(r.category==='speaker-attribution'&&r.action==='prompt-refinement'&&previousAttributionRecoveries.length)throw Error('Repeated speaker-attribution failure requires new coverage or independent audio, not another appended prohibition');
 return r;
}
export async function enqueue(root:string,s:State,provider:string,scope:Scope={},options:{alternative?:boolean;correction?:string;recovery?:unknown;seed?:number;estimate?:number;prepareOnly?:boolean}={}){
 const shots=scoped(latest(s.shots),scope);if(!shots.length)throw Error('No active shots in requested scope');const made:GenerationJob[]=[];
 for(const shot of shots){if(!shot.durationReason?.trim())throw Error(`Approved skill-directed shot plan requires durationReason before prompt compilation: ${shot.id}. Run task --stage shots and import the refined plan.`);
  if(isOfficialH3(shot)&&(options.alternative||options.correction)&&!options.recovery)throw Error('Official H3 recovery requires --recovery with evidence, diagnosis, changed variable and expected improvement');
  const recovery=options.recovery?validateRecovery(s,shot,options.recovery):undefined;
  if(recovery?.action==='seed-variation'){const prior=s.jobs.find(j=>j.id===recovery.fromJobId)!;if(options.seed===undefined||options.seed===prior.package.seed)throw Error('Seed variation requires an explicit different --seed for a controlled comparison');}
  const selectedProvider=provider==='auto'?routeAdapter(shot):provider;const pack=await compile(root,s,shot,selectedProvider,options.correction,options.seed,!!options.prepareOnly);if(recovery)pack.parameters.recovery=recovery;const fingerprint=sha(JSON.stringify(pack));
  const existing=s.jobs.find(x=>x.fingerprint===fingerprint&&x.state!=='stale'&&x.state!=='failed');if(existing&&!options.alternative)continue;
  const paid=capabilities[selectedProvider].paid;const estimate=options.estimate??0;
  const j:GenerationJob={id:uid('JOB'),shotId:shot.id,shotVersion:shot.version,episodeId:shot.episodeId,sceneId:shot.sceneId,package:pack,fingerprint,state:'queued',attempts:0,maxAttempts:s.config.maxAttempts,estimate,paid,reserved:false,createdAt:now(),updatedAt:now()};
  s.jobs.push(j);made.push(j);
 }
 return made;
}
export const jobScopeHash=(jobs:GenerationJob[])=>sha(JSON.stringify(jobs.map(j=>({id:j.id,fingerprint:j.fingerprint,estimate:j.estimate,paid:j.paid})).sort((a,b)=>a.id.localeCompare(b.id))));
function checkEpisodeBudget(s:State,jobs:GenerationJob[]){
 for(const ep of new Set(jobs.filter(j=>j.paid).map(j=>j.episodeId))){
  const total=s.jobs.filter(j=>j.paid&&j.episodeId===ep&&(j.reserved||jobs.some(x=>x.id===j.id))).reduce((sum,j)=>sum+j.estimate,0);
  if(total>s.config.premiumBudgetPerEpisode)throw Error(`Premium episode budget exhausted for ${ep}: ${total} > ${s.config.premiumBudgetPerEpisode}`);
 }
}
export function approveJobs(s:State,scope:Scope,options:{local:boolean;paid:boolean;maxCost:number;reason:string;hours?:number}){
 const jobs=scoped(s.jobs,scope).filter(j=>!['succeeded','stale'].includes(j.state));if(!jobs.length)throw Error('No pending jobs');
 if(jobs.some(j=>j.paid&&(!options.paid||j.estimate<=0)))throw Error('Paid jobs require a positive provider cost estimate and --paid');
 const total=jobs.reduce((n,j)=>n+j.estimate,0);if(total>options.maxCost||total>s.config.budget)throw Error(`Estimated cost ${total} exceeds approval/project budget`);
 checkEpisodeBudget(s,jobs);
 const a={id:uid('APPROVAL'),scopeHash:jobScopeHash(jobs),jobIds:jobs.map(j=>j.id),expiresAt:new Date(Date.now()+(options.hours??24)*3600000).toISOString(),maxCost:options.maxCost,maxJobs:jobs.length,usedJobs:0,spent:0,allowPaid:options.paid,allowLocal:options.local,reason:options.reason};s.approvals.push(a);return a;
}
function authorize(s:State,j:GenerationJob,token:string|undefined,jobs:GenerationJob[]){if(j.package.simulated)return;
 const a=s.approvals.find(a=>a.id===token);if(!a)throw Error('Real execution requires a scoped approval token: studio approve --local / --paid');
 if(Date.parse(a.expiresAt)<Date.now())throw Error('Approval expired');
 const authorizedJobs=s.jobs.filter(x=>a.jobIds.includes(x.id));
 if(!a.jobIds.includes(j.id)||a.scopeHash!==jobScopeHash(authorizedJobs))throw Error('Approval scope changed; approve the current jobs');
 checkEpisodeBudget(s,[j]);
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
  try{if(sha(JSON.stringify(j.package))!==j.fingerprint)throw Error('Job package integrity changed; create an explicit alternative');const a=adapter(j.package.adapter);if(!j.remoteId)await a.prepare(root,s,j,{prepareOnly:options.prepareOnly});if(options.prepareOnly){if(j.package.adapter.startsWith('comfy-')){const cfg=s.config.comfy.apiWorkflows[j.package.adapter];if(cfg)cfg.verified=true;}return;}
   if(!j.remoteId||!j.reserved)authorize(s,j,token,approvalJobs);
   if(!j.remoteId){j.attempts++;j.state='running';}j.updatedAt=now();await checkpoint();
   const file=await a.execute(root,s,j,checkpoint);if(file)await registerTake(root,s,j,file);await checkpoint();
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
