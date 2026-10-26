import path from 'node:path';
import { type State } from './contracts.js';
import { latest, base, dep, now, fileSha, inside, invalidate } from './store.js';
import { checkMedia, probe } from './media.js';
import { selectorDimensions } from './adapters.js';
import { scoped, type Scope } from './planning.js';
export async function technicalReview(root:string,s:State,scope:Scope={}){
 const shots=scoped(latest(s.shots),scope);const ids=new Set(shots.map(x=>x.id));const results=[];
 for(const take of latest(s.takes).filter(t=>ids.has(t.shotId))){const job=s.jobs.find(j=>j.id===take.jobId)!;const file=inside(root,take.file);let result;
  try{if(await fileSha(file)!==take.sha256)throw Error('Media integrity changed outside versioning');const workflow=s.config.comfy.apiWorkflows[job.package.adapter];const selector=workflow?.resolutionMegapixels&&workflow.bindings.width?.node===workflow.bindings.height?.node?selectorDimensions(s.project.profile.width,s.project.profile.height,workflow.resolutionMegapixels):undefined;result=await checkMedia(file,{width:selector?.width??job.package.width,height:selector?.height??job.package.height,fps:job.package.fps,duration:job.package.durationSeconds},s.config);}catch(e){result={pass:false,findings:[(e as Error).message],temporalFlags:[],info:undefined};}
  take.technical=result.pass?'pass':'fail';if(!result.pass){take.status='rejected';invalidate(s,take.id,take.version);const shot=latest(s.shots).find(x=>x.id===take.shotId);if(shot?.selectedTakeId===take.id){shot.selectedTakeId=undefined;shot.finalState='generated';}}
  s.reviews.push({...base(`REVIEW-TECH-${s.reviews.length+1}`,[dep(take)]),targetId:take.id,targetVersion:take.version,kind:'technical',verdict:result.pass?'pass':'fail',reviewer:'FFmpeg',findings:[...result.findings,...result.temporalFlags.map(x=>`Requires visual inspection: ${x}`)],measurements:result.info,createdAt:now()});results.push({takeId:take.id,...result});
 }
 return results;
}
export function visualReview(s:State,takeId:string,verdict:'pass'|'fail',reviewer:string,findings:string[]){if(!reviewer.trim())throw Error('Named audiovisual reviewer required');const take=latest(s.takes).find(x=>x.id===takeId);if(!take)throw Error('Unknown take');take.audiovisual=take.simulated?'simulated':verdict;take.status=verdict==='pass'?'approved':'rejected';s.reviews.push({...base(`REVIEW-AV-${s.reviews.length+1}`,[dep(take)]),targetId:take.id,targetVersion:take.version,kind:'audiovisual',verdict:take.simulated?'simulated':verdict,reviewer,findings,createdAt:now()});if(verdict==='fail')invalidate(s,take.id,take.version);}
export async function selectTake(root:string,s:State,takeId:string,input:number,output:number){const take=latest(s.takes).find(x=>x.id===takeId);if(!take||take.status!=='approved'||take.technical!=='pass'||!['pass','simulated'].includes(take.audiovisual))throw Error('Selection requires technical pass and explicit audiovisual approval');const media=await probe(inside(root,take.file),s.config);if(!Number.isFinite(input)||!Number.isFinite(output)||input<0||output<=input||output>media.duration+0.015)throw Error('Invalid editorial in/out points');
 const shot=latest(s.shots).find(x=>x.id===take.shotId);if(!shot)throw Error('Shot stale or absent');const previous=shot.selectedTakeId;if(previous&&previous!==takeId){const prev=latest(s.takes).find(t=>t.id===previous);if(prev)invalidate(s,prev.id,prev.version);}
 if(take.inSeconds!==undefined&&(take.inSeconds!==input||take.outSeconds!==output))invalidate(s,take.id,take.version);
 take.inSeconds=input;take.outSeconds=output;shot.selectedTakeId=takeId;shot.finalState='selected';
 const job=s.jobs.find(j=>j.id===take.jobId);const review=s.reviews.filter(r=>r.targetId===take.id&&r.kind==='audiovisual').at(-1);
 if(review){const usableSeconds=output-input;const knownCost=job?.paid?job.estimate:0;review.measurements={...review.measurements,usableSeconds,selectedIn:input,selectedOut:output,estimatedPremiumCost:knownCost,costPerApprovedSecond:knownCost===undefined?undefined:knownCost/usableSeconds,costBasis:'provider estimate; actual billed cost and local compute cost unmeasured'};}
}
