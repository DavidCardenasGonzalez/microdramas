import { SequenceContinuity, type State } from './contracts.js';
import { dep, invalidate, latest } from './store.js';

/** A new version preserves the prior sequence bible and invalidates only its dependents. */
export function importContinuity(s:State,input:unknown){
 const c=SequenceContinuity.parse(input);
 const scene=latest(s.scenes).find(x=>x.id===c.sceneId);
 if(!scene)throw Error('Continuity requires an existing source scene');
 if(c.characters.some(x=>!scene.characterIds.includes(x.characterId)))throw Error('Unknown character in sequence continuity');
 if(new Set(c.characters.map(x=>x.characterId)).size!==c.characters.length)throw Error('Duplicate continuity character');
 if(c.props.some(x=>x.ownerId&&!scene.characterIds.includes(x.ownerId)))throw Error('Unknown prop owner in continuity');
 if(/\[INSERT\b|\bTODO\b|same (room|setting) as before/i.test(c.canonicalText))throw Error('Continuity needs complete executable English text, without placeholders');
 const old=latest(s.sequenceContinuities).find(x=>x.id===c.id);
 const content=(x:typeof c)=>JSON.stringify({...x,version:0,status:'approved',deps:[]});
 if(old&&content(old)===content(c))return old;
 if(old){invalidate(s,old.id,old.version);old.status='stale';}
 c.version=Math.max(0,...s.sequenceContinuities.filter(x=>x.id===c.id).map(x=>x.version))+1;
 c.status='approved';c.deps=[dep(scene),...c.characters.map(x=>dep(latest(s.characters).find(ch=>ch.id===x.characterId)!))];
 s.sequenceContinuities.push(c);return c;
}

export function referenceManifest(s:State){
 return latest(s.shots).flatMap(shot=>(shot.referencePlan?.references??shot.referenceIds.map(referenceId=>({referenceId}))).map(entry=>{
  const ref=latest(s.references).find(x=>x.id===entry.referenceId);
  return {shotId:shot.id,sceneId:shot.sceneId,referenceId:entry.referenceId,version:ref?.version,role:ref?.kind,assetId:ref?.assetId,approved:ref?.status==='approved',file:ref?.file,sequenceContinuity:shot.sequenceContinuity};
 }));
}
