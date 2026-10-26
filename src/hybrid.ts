import { type State, type Shot } from './contracts.js';
import { latest } from './store.js';

export const isH3=(shot:Pick<Shot,'generationMode'>)=>['h3_fast_ref','h3_motion','h3_reference_to_video'].includes(shot.generationMode??'');
export const isOfficialH3=(shot:Pick<Shot,'generationMode'>)=>['h3_fast_ref','h3_motion'].includes(shot.generationMode??'');
export function routeAdapter(shot:Shot){
 if(shot.generationMode==='h3_fast_ref')return 'comfy-h3-fast-ref';
 if(shot.generationMode==='h3_motion')return 'comfy-h3-motion';
 if(shot.generationMode==='seedance'||shot.generationMode==='kling')return shot.generationMode;
 if(shot.generationMode==='h3_reference_to_video')return 'comfy-h3-ref2v';
 if(shot.generationMode==='ltx_i2v'||shot.strategy==='i2v')return 'comfy-i2v';
 if(shot.strategy==='flf2v')return 'comfy-flf2v';
 return 'comfy-h3-fast-ref'; // An unspecified new reference route must never silently choose MSR.
}
export function validateHybridPlan(s:State,shot:Shot){
 if(!shot.generationMode){if(shot.referencePlan)throw Error('Reference Plan requires an explicit generationMode');return;}
 if(!shot.routingReason?.trim())throw Error('Hybrid routing requires routingReason from scene direction');
 if(shot.sequenceContinuity){const c=s.sequenceContinuities.find(x=>x.id===shot.sequenceContinuity!.id&&x.version===shot.sequenceContinuity!.version&&x.status==='approved');if(!c||c.sceneId!==shot.sceneId)throw Error('Missing approved sequence continuity for this scene');if(!shot.deps.some(d=>d.id===c.id&&d.version===c.version))throw Error('Shot must depend on its sequence continuity version');}
 if(isOfficialH3(shot)&&(!shot.beatType||!shot.sequenceContinuity))throw Error('Official H3 direction requires beatType and approved sequenceContinuity');
 if(shot.generationMode==='seedance'||shot.generationMode==='kling'){if(!shot.escalationReason?.trim())throw Error('Premium escalation requires an indispensable scene and a documented escalationReason');return;}
 if(shot.generationMode==='ltx_i2v'){
  if(shot.strategy!=='i2v'||shot.referencePlan)throw Error('ltx_i2v requires i2v and a composed start frame, not an H3 Reference Plan');return;
 }
 const workflow=s.config.comfy.apiWorkflows[routeAdapter(shot)];
 if(workflow?.verified&&shot.durationSeconds>workflow.maxSeconds)throw Error(`H3 production limit is ${workflow.maxSeconds} seconds per generated video; split the sequence in direction`);
 if(!['reference-video','multi-shot'].includes(shot.strategy))throw Error('H3 requires reference-video or multi-shot strategy');
 const p=shot.referencePlan;if(!p)throw Error('H3 requires a Reference Plan');
 const refs=p.references.map(r=>r.referenceId);const subjects=p.subjects.map(x=>x.subjectId);
 if(new Set(refs).size!==refs.length||new Set(subjects).size!==subjects.length)throw Error('Duplicate H3 reference or subject IDs');
 if(refs.length!==shot.referenceIds.length||refs.some(id=>!shot.referenceIds.includes(id)))throw Error('Reference Plan must map every referenceId exactly once');
 for(const r of p.references){
  if(r.assetId&&!shot.assetIds.includes(r.assetId))throw Error('Reference Plan asset absent from generation unit');
  if(r.subjectId&&!subjects.includes(r.subjectId))throw Error('Unknown Reference Plan subject');
  const ref=latest(s.references).find(x=>x.id===r.referenceId);
  if(ref&&ref.kind!==r.role)throw Error(`Reference role mismatch: ${r.referenceId}`);
 }
 for(const subject of p.subjects){
  if(subject.characterId&&!shot.characterIds.includes(subject.characterId))throw Error('Reference Plan character absent from generation unit');
  if(subject.referenceIds.some(id=>!refs.includes(id)))throw Error('Subject uses an unmapped reference');
  if(!subject.referenceIds.length&&!subject.textOnlyReason?.trim())throw Error('Text-only subjects require a reason (incidental or unrecognizable presence)');
  if(isOfficialH3(shot)&&subject.characterId&&subject.referenceIds.length&&!subject.referenceIds.some(id=>p.references.some(r=>r.referenceId===id&&['identity','wardrobe'].includes(r.role))))throw Error('Recognizable subjects require their identity or combined wardrobe reference');
  if(isOfficialH3(shot))for(const id of subject.referenceIds){const entry=p.references.find(r=>r.referenceId===id)!;if(!['identity','wardrobe'].includes(entry.role))continue;const ref=latest(s.references).find(r=>r.id===id);const asset=latest(s.assets).find(a=>a.id===(ref?.assetId??entry.assetId));if((asset?.ownerId&&asset.ownerId!==subject.characterId)||(entry.subjectId&&entry.subjectId!==subject.subjectId))throw Error('Identity reference belongs to another subject');}
 }
 for(const id of shot.characterIds)if(!p.subjects.some(x=>x.characterId===id))throw Error(`Missing H3 identity mapping: ${id}`);
 let end=0;const covered:string[]=[];const ids=new Set<string>();
 for(const [i,part] of p.shots.entries()){
  if(ids.has(part.id))throw Error('Duplicate cinematic shot ID');ids.add(part.id);
  if(!isOfficialH3(shot)&&part.outSeconds-part.inSeconds>s.project.profile.maxShotSeconds)throw Error('H3 cinematic shot exceeds configured maxShotSeconds; revise direction');
  if(Math.abs(part.inSeconds-end)>0.001||part.outSeconds<=part.inSeconds||part.transition!==(i===0?'start':'hard-cut'))throw Error('H3 shots require ordered, contiguous timestamps and explicit hard cuts');
  end=part.outSeconds;covered.push(...part.beatIds);
 }
 if(Math.abs(end-shot.durationSeconds)>0.001)throw Error('H3 shot timestamps must cover the generation duration');
 if(JSON.stringify(covered)!==JSON.stringify(shot.beatIds))throw Error('H3 shots must cover source beats once, in approved order');
 if(p.shots.length>1&&shot.strategy!=='multi-shot')throw Error('Multiple cinematic shots require multi-shot strategy');
}

/** A recorded treatment is a reviewable decision, not a claim that software can judge acting. */
export function validateCinematicDirection(shot:Shot){
 if(!isOfficialH3(shot))return;
 const d=shot.direction,p=shot.referencePlan;
 if(!d||!p)throw Error(`Cinematic direction required for ${shot.id}: run task --stage shots; historical plans remain readable`);
 if(!d.characters.length||shot.characterIds.some(id=>!d.characters.some(c=>c.characterId===id))||d.characters.some(c=>!shot.characterIds.includes(c.characterId)))throw Error('Direction must identify objective, obstacle, subtext and emotional progression for each participating character');
 if(p.shots.length===1&&!d.singleShotReason?.trim())throw Error('A continuous shot requires a dramatic singleShotReason; there is no mandatory cut count');
 for(const [i,part] of p.shots.entries()){
  if(!part.dramaticPurpose?.trim()||!part.performance?.trim()||!part.visibleSubjectIds)throw Error('Each timed shot requires dramaticPurpose, observable performance and explicit visibleSubjectIds');
  if(i&&!part.cutReason?.trim())throw Error('Each cut requires a narrative or visual cutReason');
  if(new Set(part.visibleSubjectIds).size!==part.visibleSubjectIds.length||part.visibleSubjectIds.some(id=>!p.subjects.some(x=>x.subjectId===id)))throw Error('Timed shot has unknown or duplicate visible subjects');
 }
 const staging=p.dialogueStaging;
 if(!staging||staging.length!==shot.dialogue.length||new Set(staging.map(x=>x.beatId)).size!==staging.length)throw Error('Every source dialogue beat requires exactly one dialogueStaging assignment');
 let previousEnd=0;
 for(const line of shot.dialogue){
  const a=staging.find(x=>x.beatId===line.beatId),part=p.shots.find(x=>x.id===a?.shotId),speaker=p.subjects.find(x=>x.characterId===line.speakerId);
  if(!a||a.speakerId!==line.speakerId||!part?.beatIds.includes(line.beatId)||!speaker)throw Error('Dialogue staging must preserve source speaker, beat and timed shot');
  if(a.outSeconds<=a.inSeconds||a.inSeconds<part.inSeconds-0.001||a.outSeconds>part.outSeconds+0.001||a.inSeconds<previousEnd-0.001)throw Error('Speech windows must be ordered, non-overlapping and inside their assigned shots');
  previousEnd=a.outSeconds;
  if(a.strategy==='on-camera'&&(!part.visibleSubjectIds!.includes(speaker.subjectId)||a.lipSync!=='required'))throw Error('Native dialogue requires the visible source speaker and required lip sync; choose independent audio for an unseen speaker');
  if(a.strategy!=='on-camera'&&a.lipSync!=='none')throw Error('Independent offscreen/reaction audio must not request lip sync from a visible substitute');
  if(a.strategy==='offscreen-audio'&&part.visibleSubjectIds!.includes(speaker.subjectId))throw Error('Offscreen audio cannot simultaneously declare its speaker visible');
  if(a.strategy==='reaction-audio'&&(!part.visibleSubjectIds!.length||part.visibleSubjectIds!.includes(speaker.subjectId)))throw Error('Reaction audio requires a visible listener and an unseen speaker');
 }
}
export function cinematicDirectionReady(shot:Shot){try{validateCinematicDirection(shot);return true;}catch{return false;}}

export function h3Prompt(s:State,shot:Shot,sourceForBeats:(ids:string[])=>string,audioPolicy:string,correction?:string){
 const p=shot.referencePlan!;
 const label=(id:string)=>`<Picture ${p.references.findIndex(r=>r.referenceId===id)+1}>`;
 const subject=(id:string)=>`<Subject ${p.subjects.findIndex(x=>x.subjectId===id)+1}>`;
 const sentence=(value:string)=>`${value.trim().replace(/\.+$/,'')}.`;
 const timedDescription=p.shots.map(x=>[
  `${x.inSeconds.toFixed(3)}-${x.outSeconds.toFixed(3)} seconds.${x.transition==='hard-cut'?' HARD CUT.':''}`,
  sentence(`Composition: ${x.composition}`),
  x.visibleSubjectIds?sentence(`Visible in this view: ${x.visibleSubjectIds.map(subject).join(', ')||'no people'}`):'',
  sentence(`Action and blocking: ${x.action}`),x.performance?sentence(`Performance: ${x.performance}`):'',
  sentence(`Camera: ${x.camera}`),sentence(`Continuity: ${x.continuity}`)
 ].filter(Boolean).join(' ')+`\n${sourceForBeats(x.beatIds)}`).join('\n\n');
 const sections={
  subject_definitions:[...p.subjects.filter(x=>!shot.direction||p.shots.some(part=>part.visibleSubjectIds?.includes(x.subjectId))).map(x=>`${sentence(`${subject(x.subjectId)} is ${x.description}${x.referenceIds.length?`, from ${x.referenceIds.map(label).join(', ')}`:`, defined by text`}`)} ${sentence(`Wardrobe: ${x.wardrobe}`)}`),...p.references.map(r=>`${sentence(`${label(r.referenceId)} supplies ${r.role}${r.subjectId?` for ${subject(r.subjectId)}`:''}: ${r.usage}`)} ${['start','end'].includes(r.role)?(r.role==='start'?'First-frame reference: this picture aligns with the 0.00-second opening of the target video; preserve its composition and visible state before the action begins.':'Requested literal end frame.'):'Visual guidance only. Use the appearance across angles; do not reproduce reference panels, labels or studio backgrounds.'}`)].join('\n'),
  summary:`[reference generation] ${shot.durationSeconds}-second ${s.project.profile.width}:${s.project.profile.height} video. ${shot.purpose} Scene: ${latest(s.scenes).find(x=>x.id===shot.sceneId)?.heading??shot.sceneId}. Style: ${s.project.profile.style}. ${shot.durationReason}`,
  retention_analysis:`${p.retentionAnalysis}\n${p.continuityRequirements.join('\n')}`,
  detailed_description:timedDescription+`\n${sentence(`Initial state: ${shot.startState}`)} ${sentence(`Final state: ${shot.endState}`)} Play the directed progression at natural human speed. Only quoted words are spoken, once, by their attributed speaker. All other text is visual direction.${correction?`\nDirector correction: ${correction}`:''}`,
  overall_soundscape:`Planned location sound: ${shot.sound.join('; ')||'natural quiet'}. Speak only the attributed quoted dialogue.`,
  non_diegetic_music:'None throughout. Preserve natural quiet.'
 };
 const continuity=shot.sequenceContinuity?s.sequenceContinuities.find(x=>x.id===shot.sequenceContinuity!.id&&x.version===shot.sequenceContinuity!.version):undefined;
 // Keep analytical fields in the package, never send narrative titles or retention analysis as speech-prone prompt headings.
 const prompt=[audioPolicy,`Duration: ${shot.durationSeconds} seconds. ${shot.direction?`${sentence(shot.direction.genre)} ${sentence(shot.direction.visualTreatment)}`:sentence(s.project.profile.style)} Natural real-time pace.`,sections.subject_definitions,continuity?.canonicalText??p.continuityRequirements.join('\n'),sections.detailed_description,sections.overall_soundscape,'Keep dialogue and planned location sound only through the final frame; no music or synthetic dramatic accents, including from devices.'].join('\n\n');
 return {sections,prompt};
}
