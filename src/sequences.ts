import { SequencePlan, type State, type Shot, type ContinuityState } from './contracts.js';
import { dep, invalidate, latest } from './store.js';
import type { z } from 'zod';

export function importSequencePlan(s:State,input:unknown){
 const p=SequencePlan.parse(input);
 if(new Set(p.unitIds).size!==p.unitIds.length||new Set(p.sceneIds).size!==p.sceneIds.length)throw Error('Duplicate sequence unit or scene');
 const scenes=p.sceneIds.map(id=>latest(s.scenes).find(x=>x.id===id));
 if(scenes.some(x=>!x)||new Set(scenes.map(x=>x!.episodeId)).size!==1)throw Error('Sequence requires existing scenes in one episode');
 if(p.transitions.length!==p.unitIds.length-1||p.transitions.some((t,i)=>t.fromUnitId!==p.unitIds[i]||t.toUnitId!==p.unitIds[i+1]))throw Error('Sequence transitions must connect consecutive generation units exactly once');
 const old=latest(s.sequencePlans).find(x=>x.id===p.id);
 const content=(x:typeof p)=>JSON.stringify({...x,version:0,status:'approved',deps:[]});
 if(old&&content(old)===content(p))return old;
 if(old){invalidate(s,old.id,old.version);old.status='stale';}
 p.version=Math.max(0,...s.sequencePlans.filter(x=>x.id===p.id).map(x=>x.version))+1;
 p.status='approved';p.deps=scenes.map(x=>dep(x!));s.sequencePlans.push(p);return p;
}

type Snapshot=z.infer<typeof ContinuityState>;
const canonical=(x:Snapshot)=>JSON.stringify({characters:[...x.characters].sort((a,b)=>a.characterId.localeCompare(b.characterId)),props:[...x.props].sort((a,b)=>a.id.localeCompare(b.id)),doors:[...x.doors].sort((a,b)=>a.id.localeCompare(b.id)),completedActionIds:[...x.completedActionIds].sort(),spokenBeatIds:[...x.spokenBeatIds].sort()});

function validateSnapshot(s:State,shot:Shot,x:Snapshot,characterIds:string[]){
 for(const list of [x.characters.map(c=>c.characterId),x.props.map(p=>p.id),x.doors.map(p=>p.id),x.completedActionIds,x.spokenBeatIds])if(new Set(list).size!==list.length)throw Error('Duplicate dynamic continuity state key');
 if(characterIds.some(id=>!x.characters.some(c=>c.characterId===id))||x.characters.some(c=>!characterIds.includes(c.characterId)))throw Error('Dynamic state must track every sequence character, including exited characters');
 if(x.props.some(p=>p.ownerId&&!characterIds.includes(p.ownerId)))throw Error('Unknown dynamic prop owner');
 if(x.completedActionIds.some(id=>!latest(s.beats).some(b=>b.id===id&&b.kind==='action'&&b.episodeId===shot.episodeId)))throw Error('Unknown completed source action');
 if(x.spokenBeatIds.some(id=>!latest(s.beats).some(b=>b.id===id&&b.kind==='dialogue'&&b.episodeId===shot.episodeId)))throw Error('Unknown already-spoken dialogue beat');
}

export function validateSequence(s:State,shot:Shot){
 const p=s.sequencePlans.find(x=>x.id===shot.sequencePlan?.id&&x.version===shot.sequencePlan.version&&x.status==='approved');
 if(!p||!shot.deps.some(d=>d.id===p.id&&d.version===p.version))throw Error('Approved global sequencePlan and dependency required before dividing into generations');
 if(!p.unitIds.includes(shot.id))throw Error('Generation unit absent from global sequence plan');
 const units=p.unitIds.map(id=>id===shot.id?shot:latest(s.shots).find(x=>x.id===id));
 if(units.some(x=>!x))throw Error('Import all planned sequence units before approval or compilation');
 const characters=[...new Set(p.sceneIds.flatMap(id=>latest(s.scenes).find(x=>x.id===id)!.characterIds))];
 const seen=new Set<string>();const sourceEnds=new Map<string,number>();let previous:Shot|undefined;
 for(const unit of units as Shot[]){
  if(!p.sceneIds.includes(unit.sceneId)||unit.sequencePlan?.id!==p.id||unit.sequencePlan.version!==p.version||!unit.deps.some(d=>d.id===p.id&&d.version===p.version))throw Error('All sequence units must bind the same global plan version');
  if(unit.status!=='approved')throw Error('All global sequence units must be approved together before compilation');
  for(const id of unit.beatIds){const beat=latest(s.beats).find(b=>b.id===id);if(!beat)throw Error('Sequence references a missing or stale beat');const key=`${beat.source.scriptId}@${beat.source.scriptVersion}`,end=sourceEnds.get(key)??0;if(beat.source.start<end)throw Error('Global sequence beats must follow approved source order');sourceEnds.set(key,beat.source.end);}
  const c=s.sequenceContinuities.find(x=>x.id===unit.sequenceContinuity?.id&&x.version===unit.sequenceContinuity.version&&x.status==='approved');
  if(c?.scope!=='invariants')throw Error('New direction requires invariant-only canonical continuity; move positions, hands and changing props into dynamicState');
  if(!unit.dynamicState)throw Error('Dynamic start/end continuity state required for every sequence unit');
  const {start,end}=unit.dynamicState;validateSnapshot(s,unit,start,characters);validateSnapshot(s,unit,end,characters);
  for(const key of ['props','doors'] as const)if(JSON.stringify(start[key].map(x=>x.id).sort())!==JSON.stringify(end[key].map(x=>x.id).sort()))throw Error('Track the same props and doors throughout each unit, including absent or destroyed objects');
  if(previous&&canonical(previous.dynamicState!.end)!==canonical(start))throw Error(`Continuity reset between ${previous.id} and ${unit.id}: inherit the complete previous end state`);
  for(const ids of ['completedActionIds','spokenBeatIds'] as const)if(start[ids].some(id=>!end[ids].includes(id)))throw Error('Completed actions and already spoken dialogue cannot be forgotten');
  if(start.completedActionIds.some(id=>unit.beatIds.includes(id))||unit.dialogue.some(line=>start.spokenBeatIds.includes(line.beatId)))throw Error('Repeated completed action or already spoken dialogue in next generation');
  const actionIds=unit.beatIds.filter(id=>s.beats.some(b=>b.id===id&&b.kind==='action'));
  if(actionIds.some(id=>!end.completedActionIds.includes(id))||end.completedActionIds.some(id=>!start.completedActionIds.includes(id)&&!actionIds.includes(id)))throw Error('End state must record exactly the newly completed source actions');
  if(unit.dialogue.some(line=>!end.spokenBeatIds.includes(line.beatId))||end.spokenBeatIds.some(id=>!start.spokenBeatIds.includes(id)&&!unit.dialogue.some(line=>line.beatId===id)))throw Error('End state must record exactly the newly spoken source dialogue');
  if(unit.beatIds.some(id=>seen.has(id)))throw Error('Sequence repeats source beats across generations');
  unit.beatIds.forEach(id=>seen.add(id));
  if(previous&&JSON.stringify(previous.cinematicStyle)!==JSON.stringify(unit.cinematicStyle))throw Error('Sequence units must preserve the production cinematic style version');
  previous=unit;
 }
 return p;
}

/** Emit no event ledger or dialogue text: those belong to metadata and temporal speech. */
export function dynamicStateText(s:State,x:Snapshot,previous?:Snapshot){
 const name=(id:string)=>latest(s.characters).find(c=>c.id===id)?.name??id;
 const objectName=(id:string)=>latest(s.assets).find(a=>a.id===id)?.name??id.replace(/^(PROP|DOOR|OBJECT)[_.-]/,'').replace(/[_.-]/g,' ').toLowerCase();
 const fields=['presence','position','posture','hands','wardrobe','injuries','eyeline','emotion'] as const;
 return [
  ...x.characters.map(c=>{const old=previous?.characters.find(p=>p.characterId===c.characterId);const changed=fields.filter(k=>old?old[k]!==c[k]:k!=='wardrobe');return changed.length?`${name(c.characterId)}: ${changed.map(k=>`${k} ${c[k]}`).join('; ')}.`:'';}),
  ...x.props.filter(p=>!previous||JSON.stringify(previous.props.find(old=>old.id===p.id))!==JSON.stringify(p)).map(p=>`${objectName(p.id)}: ${p.state}; ${p.ownerId?`held by ${name(p.ownerId)}`:'no character holds it'}.`),
  ...x.doors.filter(d=>!previous||previous.doors.find(old=>old.id===d.id)?.state!==d.state).map(d=>`${objectName(d.id)}: ${d.state}.`)
 ].filter(Boolean).join('\n')||'Keep the inherited physical state; complete only the directed progression.';
}
