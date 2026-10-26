import path from 'node:path';
import { CinematicAssessment, type State, type Timeline } from './contracts.js';
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
export const cinematicChecks={audiovisual:['identity','anatomy','performance','voice','dialogue','lipSync','movement','timing','promptFidelity','music'],continuity:['positions','props','wardrobe','location','eyelines','emotion','transition'],narrative:['rhythm','framingVariety','visualClarity','dramaticIntention','tone','repeatedActions','generationBoundaries']} as const;
function assessment(input:unknown,kind:keyof typeof cinematicChecks,verdict:'pass'|'fail',duration:number){
 const a=CinematicAssessment.parse(input);
 if(cinematicChecks[kind].some(key=>!a.checks[key]))throw Error(`Missing cinematic ${kind} checks: ${cinematicChecks[kind].join(', ')}`);
 if(a.samples.some((x,i)=>x.atSeconds>duration+0.015||(i>0&&x.atSeconds<=a.samples[i-1].atSeconds)))throw Error('Review requires ordered temporal samples within the selected media range');
 if(verdict==='pass'&&Object.values(a.checks).some(c=>c.verdict==='fail'))throw Error('A failed cinematic check cannot be approved');
 if(cinematicChecks[kind].filter(key=>!['voice','dialogue','lipSync'].includes(key)).some(key=>a.checks[key].verdict==='not-applicable'))throw Error('Core cinematic checks cannot be marked not-applicable');
 return a;
}
export function visualReview(s:State,takeId:string,verdict:'pass'|'fail',reviewer:string,findings:string[],input?:unknown){
 if(!reviewer.trim())throw Error('Named audiovisual reviewer required');const take=latest(s.takes).find(x=>x.id===takeId);if(!take)throw Error('Unknown take');
 const shot=latest(s.shots).find(x=>x.id===take.shotId),job=s.jobs.find(j=>j.id===take.jobId);
 const a=input?assessment(input,'audiovisual',verdict,job?.package.durationSeconds??shot?.durationSeconds??0):undefined;
 if(verdict==='pass'&&!take.simulated&&shot?.cinematicStyle&&!a)throw Error('Cinematic audiovisual pass requires --assessment with actual video/audio review, temporal samples and all individual checks');
 take.audiovisual=take.simulated?'simulated':verdict;take.status=verdict==='pass'?'approved':'rejected';
 s.reviews.push({...base(`REVIEW-AV-${s.reviews.length+1}`,[dep(take)]),targetId:take.id,targetVersion:take.version,kind:'audiovisual',verdict:take.simulated&&verdict==='pass'?'simulated':verdict,reviewer,findings,measurements:a?{assessment:a}:undefined,createdAt:now()});
 if(verdict==='fail'){invalidate(s,take.id,take.version);if(shot?.selectedTakeId===take.id){shot.selectedTakeId=undefined;shot.finalState='generated';}}
}

export function sequenceReview(s:State,timelineId:string,kind:'continuity'|'narrative',verdict:'pass'|'fail',reviewer:string,findings:string[],input:unknown){
 if(!reviewer.trim())throw Error('Named sequence reviewer required');const t=latest(s.timelines).find(x=>x.id===timelineId);if(!t)throw Error('Unknown timeline');
 const duration=t.segments.reduce((n,x)=>n+x.sourceOut-x.sourceIn,0),a=assessment(input,kind,verdict,duration);
 const simulated=t.segments.some(seg=>s.takes.find(x=>x.id===seg.takeId)?.simulated);
 const old=s.reviews.filter(r=>r.targetId===t.id&&r.targetVersion===t.version&&r.kind===kind&&r.status!=='stale').at(-1);if(old){invalidate(s,old.id,old.version);old.status='stale';}
 const review={...base(`REVIEW-${kind.toUpperCase()}-${s.reviews.length+1}`,[dep(t)]),status:'approved' as const,targetId:t.id,targetVersion:t.version,kind,verdict:simulated&&verdict==='pass'?'simulated' as const:verdict,reviewer,findings,measurements:{assessment:a},createdAt:now()};s.reviews.push(review);return review;
}

export function sequenceQuality(s:State,t:Timeline){
 return (['continuity','narrative'] as const).map(kind=>({kind,review:s.reviews.filter(r=>r.targetId===t.id&&r.targetVersion===t.version&&r.kind===kind&&r.status!=='stale').at(-1)}));
}
export async function selectTake(root:string,s:State,takeId:string,input:number,output:number){const take=latest(s.takes).find(x=>x.id===takeId);if(!take||take.status!=='approved'||take.technical!=='pass'||!['pass','simulated'].includes(take.audiovisual))throw Error('Selection requires technical pass and explicit audiovisual approval');const media=await probe(inside(root,take.file),s.config);if(!Number.isFinite(input)||!Number.isFinite(output)||input<0||output<=input||output>media.duration+0.015)throw Error('Invalid editorial in/out points');
 const shot=latest(s.shots).find(x=>x.id===take.shotId);if(!shot)throw Error('Shot stale or absent');const previous=shot.selectedTakeId;if(previous&&previous!==takeId){const prev=latest(s.takes).find(t=>t.id===previous);if(prev)invalidate(s,prev.id,prev.version);}
 if(take.inSeconds!==undefined&&(take.inSeconds!==input||take.outSeconds!==output))invalidate(s,take.id,take.version);
 take.inSeconds=input;take.outSeconds=output;shot.selectedTakeId=takeId;shot.finalState='selected';
 const job=s.jobs.find(j=>j.id===take.jobId);const review=s.reviews.filter(r=>r.targetId===take.id&&r.kind==='audiovisual').at(-1);
 if(review){const usableSeconds=output-input;const knownCost=job?.paid?job.estimate:0;review.measurements={...review.measurements,usableSeconds,selectedIn:input,selectedOut:output,estimatedPremiumCost:knownCost,costPerApprovedSecond:knownCost===undefined?undefined:knownCost/usableSeconds,costBasis:'provider estimate; actual billed cost and local compute cost unmeasured'};}
}
