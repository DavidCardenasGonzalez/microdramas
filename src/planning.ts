import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { validateHybridPlan, isH3 } from './hybrid.js';
import { referenceManifest } from './continuity.js';
import { Shot as ShotSchema, type State, type Shot } from './contracts.js';
import { latest, base, dep, sha, diagnostic, atomic, fileSha, invalidate, now, exists } from './store.js';
export type Scope={episode?:string;scene?:string;shot?:string};
export function scoped<T extends {id:string;episodeId?:string;sceneId?:string;shotId?:string}>(items:T[],scope:Scope){return items.filter(x=>(!scope.episode||x.episodeId===scope.episode)&&(!scope.scene||x.sceneId===scope.scene||x.id===scope.scene)&&(!scope.shot||x.id===scope.shot||x.shotId===scope.shot));}
export function approvedScript(s:State,episodeId:string){const sc=s.scripts.filter(x=>x.episodeId===episodeId&&x.status==='approved').at(-1);if(!sc)throw Error(`Approved script required for ${episodeId}`);return sc;}
export function validateSource(s:State,source:{scriptId:string;scriptVersion:number;start:number;end:number;quote:string}){const sc=s.scripts.find(x=>x.id===source.scriptId&&x.version===source.scriptVersion);if(!sc||sc.text.slice(source.start,source.end)!==source.quote)throw Error('Source span does not match original script');}
function dialogueCue(raw:string){
 let name=raw.trim().replace(/^@/,''),delivery:'offscreen'|'voice-over'|undefined;
 for(;;){const match=name.match(/\s*\((O\.S\.|O\.C\.|V\.O\.|CONT['’]D)\)\s*$/i);if(!match)break;const extension=match[1].toUpperCase();if(extension==='V.O.')delivery='voice-over';else if(extension==='O.S.'||extension==='O.C.')delivery??='offscreen';name=name.slice(0,match.index).trim();}
 return {name,delivery};
}
function reconcileResolvedPlanDiagnostics(s:State,episodeId:string,scriptText:string){
 const scenes=latest(s.scenes).filter(x=>x.episodeId===episodeId);
 const headings=[...scriptText.matchAll(/^(?:INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.)[^\r\n]+/gm)];
 const normalize=(value:string)=>value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 const currentCharacters=latest(s.characters).filter(c=>c.status==='approved');
 const speakerResolved=(label:string,sceneId:string)=>{
  const scene=scenes.find(x=>x.id===sceneId);if(!scene)return false;
  const match=headings.findIndex(h=>h[0]===scene.heading);if(match<0)return false;
  const start=headings[match].index!,end=headings[match+1]?.index??scriptText.length;
  const body=scriptText.slice(start,end);
  const key=normalize(label);
  const cues=body.split(/\r?\n/).map(line=>dialogueCue(line).name).filter(line=>/^[A-Z][A-Z ]+$/.test(line));
  if(!cues.some(cue=>normalize(cue)===key))return true; // Old diagnostic refers to a cue no longer present in this approved source.
  return cues.some(cue=>normalize(cue)===key&&currentCharacters.some(c=>normalize(c.name)===key));
 };
 s.diagnostics=s.diagnostics.filter(d=>{
  if(d.stage!=='plan'||d.severity!=='blocker')return true;
  const preamble=d.message.match(/^Unparsed preamble in (.+)$/);
  if(preamble&&preamble[1]===episodeId&&headings.length){return scriptText.slice(0,headings[0].index).trim().length>0;}
  const speaker=d.message.match(/^Unresolved speaker (.+)$/);
  if(speaker&&d.targetId&&scenes.some(x=>x.id===d.targetId)&&speakerResolved(speaker[1],d.targetId))return false;
  return true;
 });
}
export function plan(s:State,scope:Scope={},approve=false){
 if(s.project.profile.format==='novel'){diagnostic(s,'plan','Written-only project','Export narrative files directly; create an explicit adaptation request for audiovisual work.');return;}
 for(const ep of latest(s.episodes).filter(x=>!scope.episode||x.id===scope.episode)){
  const script=approvedScript(s,ep.id);
  reconcileResolvedPlanDiagnostics(s,ep.id,script.text);
  if(latest(s.scenes).some(x=>x.scriptId===script.id&&x.source.scriptVersion===script.version)){
   const newest=[...new Map(s.shots.filter(x=>x.episodeId===ep.id).map(x=>[x.id,x])).values()];
   for(const old of newest.filter(x=>x.status==='stale'&&x.deps.some(d=>d.id===script.id&&d.version===script.version))){const assets=old.assetIds.map(id=>latest(s.assets).find(a=>a.id===id));if(assets.some(a=>!a))throw Error('Resolve stale assets before replanning');s.shots.push({...structuredClone(old),version:old.version+1,status:approve?'approved':'draft',referenceIds:[],selectedTakeId:undefined,finalState:'planned',deps:[...old.deps.filter(d=>!d.id.startsWith('REF-')&&!old.assetIds.includes(d.id)),...assets.map(a=>dep(a!))]});}
   continue;
  }
  const text=script.text;const headings=[...text.matchAll(/^(?:INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.)[^\r\n]+/gm)];
  if(!headings.length){diagnostic(s,'plan',`No explicit scene headings in ${ep.id}`,'Screenwriting may format a new draft, or supply a source-anchored breakdown; original remains unchanged.',ep.id);continue;}
  const preamble=text.slice(0,headings[0].index).trim();if(preamble)diagnostic(s,'plan',`Unparsed preamble in ${ep.id}`,'Move title metadata outside the screenplay or provide a structured breakdown before generating.',ep.id);
  const usedSceneIds=new Set<string>();const priorScenes=[...new Map(s.scenes.filter(x=>x.episodeId===ep.id).map(x=>[x.id,x])).values()];let nextSceneNumber=Math.max(0,...priorScenes.map(x=>Number(x.id.match(/-SC(\d+)$/)?.[1]??0)))+1;
  for(const [i,heading] of headings.entries()){
   const start=heading.index!,end=headings[i+1]?.index??text.length;const prior=priorScenes.find(x=>x.heading===heading[0]&&!usedSceneIds.has(x.id));const sceneId=prior?.id??`${ep.id}-SC${String(nextSceneNumber++).padStart(3,'0')}`;usedSceneIds.add(sceneId);
   const source={scriptId:script.id,scriptVersion:script.version,start,end,quote:text.slice(start,end)};
   const chars=latest(s.characters).filter(c=>new RegExp(`(?<![\\p{L}\\p{N}_])${c.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![\\p{L}\\p{N}_])`,'iu').test(source.quote));
   const sc={...base(sceneId,[dep(script)]),status:'approved' as const,scriptId:script.id,episodeId:ep.id,heading:heading[0],location:heading[0].replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|\.)\s*/,'').split(/\s+-\s+/)[0],time:heading[0].split(/\s+-\s+/).slice(1).join(' - ')||'unspecified',characterIds:chars.map(c=>c.id),source};
   const oldScene=s.scenes.filter(x=>x.id===sceneId).at(-1);sc.version=(oldScene?.version??0)+1;s.scenes.push(sc);
   const bodyStart=start+heading[0].length;const body=text.slice(bodyStart,end);const seen=new Map<string,number>();
   const sceneBeats=[];
   for(const m of body.matchAll(/\S[^\r\n]*(?:\r?\n(?!\s*\r?\n)[^\r\n]+)*/g)){
    const chunk=m[0].trimEnd();const begin=bodyStart+m.index!;const lines=chunk.split(/\r?\n/);const cue=dialogueCue(lines[0]);const who=lines.length>1?chars.find(c=>cue.name===c.name.toUpperCase()):undefined;
    const performanceNotes=who?lines.slice(1).filter(line=>/^\([^)]*\)$/.test(line.trim())).map(line=>line.trim().slice(1,-1)):undefined;
    const words=who?lines.slice(1).filter(line=>!/^\([^)]*\)$/.test(line.trim())).join('\n'):chunk;
    if(!who&&lines.length>1&&/^[A-Z][A-Z ]+$/.test(cue.name)){diagnostic(s,'plan',`Unresolved speaker ${cue.name}`,'Add the character to the approved narrative facts.',sceneId);}
    const h=sha(chunk).slice(0,8);const occurrence=(seen.get(h)??0)+1;seen.set(h,occurrence);const id=`${sceneId}-B-${h}-${occurrence}`;
    const old=s.beats.filter(x=>x.id===id).at(-1);const beat={...base(id,[dep(sc),dep(script)]),version:(old?.version??0)+1,status:'approved' as const,sceneId,episodeId:ep.id,source:{scriptId:script.id,scriptVersion:script.version,start:begin,end:begin+chunk.length,quote:chunk},kind:who?'dialogue' as const:'action' as const,speakerId:who?.id,delivery:who?cue.delivery:undefined,performanceNotes:performanceNotes?.length?performanceNotes:undefined,text:words,characterIds:who?[who.id]:chars.filter(c=>chunk.toLowerCase().includes(c.name.toLowerCase())).map(c=>c.id),emotion:'Director interprets objective, obstacle, subtext and emotional progression from approved context; express them through observable performance without inventing narrative facts',sound:[]};
    validateSource(s,beat.source);s.beats.push(beat);sceneBeats.push(beat);
   }
   let group:typeof sceneBeats=[];let seconds=0;const groups:{beats:typeof sceneBeats;seconds:number}[]=[];
   for(const beat of sceneBeats){const duration=beat.kind==='dialogue'?Math.max(2,beat.text.split(/\s+/).length/2.2+0.8):Math.max(2,Math.min(5,beat.text.split(/\s+/).length/4));if(group.length&&seconds+duration>s.project.profile.maxShotSeconds){groups.push({beats:group,seconds});group=[];seconds=0;}group.push(beat);seconds+=duration;}
   if(group.length)groups.push({beats:group,seconds});
   const newShots:Shot[]=[];const priorShots=[...new Map(s.shots.filter(x=>x.sceneId===sceneId).map(x=>[x.id,x])).values()];const usedShotIds=new Set<string>();let nextShotNumber=Math.max(0,...priorShots.map(x=>Number(x.id.match(/-SH(\d+)$/)?.[1]??0)))+1;
   for(const [j,g] of groups.entries()){
    const matching=priorShots.filter(x=>!usedShotIds.has(x.id)).map(x=>({shot:x,overlap:x.beatIds.filter(id=>g.beats.some(b=>b.id===id)).length})).filter(x=>x.overlap>0).sort((a,b)=>b.overlap-a.overlap)[0]?.shot;const id=matching?.id??`${sceneId}-SH${String(nextShotNumber++).padStart(3,'0')}`;usedShotIds.add(id);const old=s.shots.filter(x=>x.id===id).at(-1);
    const quote=g.beats.map(b=>b.source.quote).join('\n\n');const assets=latest(s.assets).filter(a=>a.kind==='character'?chars.some(c=>c.id===a.ownerId):a.kind==='wardrobe'?chars.some(c=>c.id===a.ownerId):a.aliases.some(alias=>source.quote.toLowerCase().includes(alias.toLowerCase())));
    const shot=ShotSchema.parse({...base(id,[dep(script),dep(sc),...g.beats.map(dep),...assets.map(dep),...chars.map(dep)]),version:(old?.version??0)+1,status:approve?'approved':'draft',scriptId:script.id,sceneId,episodeId:ep.id,beatIds:g.beats.map(b=>b.id),characterIds:chars.map(c=>c.id),referenceIds:[],assetIds:assets.map(a=>a.id),purpose:'Present the source beats in order; preserve audience knowledge.',framing:j===0?'medium shared shot':'medium shot; refine coverage before final production',camera:{position:'eye-level; same side of established axis',movement:'undirected scaffold: director must choose camera behavior for the dramatic beat',lens:'50mm equivalent',focus:'characters in focus; restrained background'},blocking:'Use only positions/actions evidenced in source. Unspecified positions require visual plan review.',startState:g.beats[0].source.quote,endState:g.beats.at(-1)!.source.quote,durationSeconds:Math.ceil(g.seconds),continuity:{axis:'maintain scene axis; no unmotivated crossing',eyelines:'complementary eyelines within shared geography',wardrobe:assets.filter(a=>a.kind==='wardrobe').map(a=>a.description).join('; '),props:assets.filter(a=>a.kind==='prop').map(a=>a.description).join('; '),lighting:'consistent within scene; interpret stated time'},dialogue:g.beats.filter(b=>b.kind==='dialogue').map(b=>({speakerId:b.speakerId!,text:b.text,beatId:b.id})),sound:[],strategy:'reference-video'});
    if(shot.durationSeconds>s.project.profile.maxShotSeconds){shot.status='draft';diagnostic(s,'plan',`Beat exceeds configured shot duration (${shot.durationSeconds}s)`,'Director must propose coverage or Screenwriting an explicit revision; no dialogue truncation.',id);}
    s.shots.push(shot);newShots.push(shot);
   }
   for(const [j,shot] of newShots.entries()){shot.previousShotId=newShots[j-1]?.id;shot.nextShotId=newShots[j+1]?.id;}
  }
 }
}
export function validateShot(s:State,shot:Shot){
 validateHybridPlan(s,shot);
 ShotSchema.parse(shot);const script=approvedScript(s,shot.episodeId);if(!shot.deps.some(x=>x.id===script.id&&x.version===script.version))throw Error(`Stale script dependency ${shot.id}`);
 const beats=shot.beatIds.map(id=>latest(s.beats).find(x=>x.id===id));if(beats.some(x=>!x))throw Error('Missing beat');
 for(const b of beats)validateSource(s,b!.source);
 if(shot.direction)for(const b of beats.filter(b=>b!.delivery)){if(shot.referencePlan?.dialogueStaging?.find(a=>a.beatId===b!.id)?.strategy==='on-camera')throw Error('Source marks this voice offscreen; revise the screenplay explicitly before showing its speaker');}
 const expected=beats.filter(b=>b!.kind==='dialogue').map(b=>({speakerId:b!.speakerId,text:b!.text,beatId:b!.id}));if(shot.dialogue.length!==expected.length||expected.some((line,i)=>{const actual=shot.dialogue[i];return actual.speakerId!==line.speakerId||actual.text!==line.text||actual.beatId!==line.beatId;}))throw Error(`Dialogue alteration in ${shot.id}`);
 if(shot.characterIds.some(id=>!latest(s.characters).some(c=>c.id===id)))throw Error('Unknown shot character');
}
export function prepareReferences(s:State,scope:Scope={}){
 for(const shot of scoped(latest(s.shots),scope)){
  if(isH3(shot)){
   validateHybridPlan(s,shot);
   for(const entry of shot.referencePlan!.references){const id=entry.referenceId;let ref=latest(s.references).find(r=>r.id===id);if(!ref){const asset=latest(s.assets).find(a=>a.id===entry.assetId);if(!asset)throw Error(`Missing H3 reference ${id}: provide its existing assetId to prepare a pending record`);const history=s.references.filter(r=>r.id===id);ref={...base(id,[dep(asset)]),version:Math.max(0,...history.map(r=>r.version))+1,status:'pending',assetId:asset.id,shotIds:[],kind:entry.role,description:asset.description,purpose:entry.usage,simulated:false};s.references.push(ref);}if(!ref.shotIds.includes(shot.id))ref.shotIds.push(shot.id);if(!shot.deps.some(d=>d.id===id&&d.version===ref.version))shot.deps.push(dep(ref));}
   continue;
  }
  for(const id of shot.assetIds){const asset=latest(s.assets).find(a=>a.id===id);if(!asset)throw Error(`Missing asset ${id}`);if(asset.kind==='wardrobe'&&shot.assetIds.some(other=>s.assets.some(a=>a.id===other&&a.kind==='character'&&a.ownerId===asset.ownerId)))continue;const refId=`REF-${asset.id}`;let ref=latest(s.references).find(r=>r.id===refId);
   if(!ref){const old=s.references.filter(x=>x.id===refId).at(-1);ref={...base(refId,[dep(asset)]),version:(old?.version??0)+1,status:'pending',assetId:asset.id,shotIds:[],kind:asset.kind==='character'?'identity':asset.kind,description:asset.description,purpose:`Reusable ${asset.kind} continuity reference`,simulated:false};s.references.push(ref);}
   if(!ref.shotIds.includes(shot.id))ref.shotIds.push(shot.id);if(!shot.referenceIds.includes(ref.id))shot.referenceIds.push(ref.id);if(!shot.deps.some(d=>d.id===ref!.id&&d.version===ref!.version))shot.deps.push(dep(ref));
  }
  for(const kind of shot.strategy==='flf2v'?['start','end']:shot.strategy==='i2v'?['start']:[]){const id=`REF-${shot.id}-${kind}`;if(!latest(s.references).some(r=>r.id===id))s.references.push({...base(id),status:'pending',shotIds:[shot.id],kind:kind as 'start'|'end',description:`${kind} frame: ${kind==='start'?shot.startState:shot.endState}`,purpose:`Mandatory ${kind} frame conditioning`,simulated:false});if(!shot.referenceIds.includes(id))shot.referenceIds.push(id);const r=latest(s.references).find(r=>r.id===id)!;if(!shot.deps.some(d=>d.id===r.id))shot.deps.push(dep(r));}
 }
}
export async function attachReference(root:string,s:State,id:string,file:string,reviewer:string,simulated=false){
 const ref=latest(s.references).find(r=>r.id===id);if(!ref)throw Error(`Unknown reference ${id}`);if(!await exists(file))throw Error(`Reference file missing: ${file}`);
 const contentHash=await fileSha(file);if(ref.sha256===contentHash&&ref.status==='approved')return ref;
 let target=ref;if(ref.file){invalidate(s,ref.id,ref.version);ref.status='stale';target={...ref,version:ref.version+1,status:'pending',file:undefined,sha256:undefined};s.references.push(target);for(const shot of latest(s.shots))if(shot.referenceIds.includes(id))shot.deps=shot.deps.filter(d=>d.id!==id).concat(dep(target));}
 const dest=path.join(root,'references',`${id}.v${target.version}${path.extname(file)||'.png'}`);await mkdir(path.dirname(dest),{recursive:true});if(path.resolve(dest)!==path.resolve(file))await copyFile(file,dest);
 target.file=path.relative(root,dest);target.sha256=contentHash;target.status='approved';target.reviewedBy=reviewer;target.simulated=simulated;return target;
}
export function reviseAsset(s:State,id:string,description:string){const asset=latest(s.assets).find(x=>x.id===id);if(!asset)throw Error(`Unknown asset ${id}`);const affected=invalidate(s,asset.id,asset.version);asset.status='stale';s.assets.push({...asset,status:'approved',version:asset.version+1,description});return affected;}
export async function planningArtifacts(root:string,s:State){await atomic(path.join(root,'contracts','production-plan.json'),{generatedView:true,sourceOfTruth:'.studio/state.json',scenes:latest(s.scenes),beats:latest(s.beats),shots:latest(s.shots),sequenceContinuities:latest(s.sequenceContinuities),reference_manifest:referenceManifest(s),references:latest(s.references)});}
