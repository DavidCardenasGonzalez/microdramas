import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { NarrativeResult, type State } from './contracts.js';
import { atomic, base, dep, latest, sha, now, invalidate, diagnostic, json } from './store.js';
const moduleDirectory=path.dirname(fileURLToPath(import.meta.url));
export const repository=path.resolve(moduleDirectory,existsSync(path.join(moduleDirectory,'..','skills.lock.json'))?'..':'../..');
export async function narrativeRequest(root:string,s:State,idea:string,stage='premise'){
  const lock=await json(path.join(repository,'skills.lock.json'));
  const routing:Record<string,string[]>={premise:['sw-workflow','sw-premise-theme'],structure:['sw-story-structure'],characters:['sw-character-conflict'],scenes:['sw-scene-craft'],draft:['sw-dialogue','sw-format-adaptation'],revision:['sw-story-structure','sw-dialogue'],season:['sw-series-engine-bible','sw-series-structure'],adaptation:['sw-format-adaptation']};
  if(!routing[stage])throw Error(`Unknown narrative stage: ${stage}`);
  const skills=routing[stage].map(name=>({name,path:path.join(repository,'vendor','screenwriting',name,'SKILL.md'),commit:lock.sources.find((x:any)=>x.key==='screenwriting').commit}));
  const packet={kind:'codex-narrative-request',authority:'screenwriting',stage,idea,projectId:s.project.id,profile:s.project.profile,skills,
    formatCriteria:s.project.profile.format==='microdrama'?['Establish a specific dramatic question promptly.','Escalate conflict through choices.','Review rhythm, hook and ending without fixed quotas.','Return recommendations to Screenwriting; never rewrite from a production skill.']:[],
    reviewRubric:s.project.profile.format==='microdrama'?path.join(repository,'vendor/drama/short-drama-review/references/rubric-story-script.md'):undefined,
    existingBible:latest(s.bibles)[0],outputSchema:path.join(repository,'schemas/narrative-result.schema.json'),
    instructions:'Codex: read ONLY listed skills and their needed references, develop in stages, persist a NarrativeResult JSON. Screenwriting alone authors narrative. Import with studio write --import <file> then approve explicitly. Production cannot fabricate missing story. For existing scripts use --script without rewriting.'};
  await atomic(path.join(root,'requests',`narrative-${stage}.json`),packet);s.brief=idea;
  diagnostic(s,'write','Narrative response pending','Codex reads requests/narrative-*.json, invokes selected Screenwriting skills, writes response JSON, imports and approves it.');
  return packet;
}
export async function importNarrative(root:string,s:State,input:unknown,approve:boolean,by:string){
  const n=NarrativeResult.parse(input);const lock=await json(path.join(repository,'skills.lock.json'));
  const known=lock.sources.find((x:any)=>x.key==='screenwriting').selected;
  if(n.skillsUsed.some(x=>!known.includes(x)))throw Error('Narrative result names an unregistered Screenwriting skill');
  const ids=[n.bible.id,...n.characters.map(x=>x.id),...n.assets.map(x=>x.id),...n.episodes.map(x=>x.id)];if(new Set(ids).size!==ids.length)throw Error('Duplicate narrative IDs');
  for(const a of n.assets)if(a.ownerId&&!n.characters.some(c=>c.id===a.ownerId))throw Error(`Unknown asset owner ${a.ownerId}`);
  if(!approve&&s.scripts.some(sc=>sc.status==='approved')){
    const file=path.join(root,'narrative','drafts',`proposal-${Date.now()}.json`);await atomic(file,n);
    for(const ep of n.episodes){if(!s.episodes.some(e=>e.id===ep.id))s.episodes.push({...base(ep.id),status:'draft',title:ep.title,synopsis:ep.synopsis,order:s.episodes.length+1});await importScript(root,s,ep.id,ep.scriptText,false,by);}
    diagnostic(s,'write','Narrative proposal pending approval',`Approve the whole package with write --import ${file} --approve, so character/asset changes and script revisions advance together.`);return;
  }
  for(const ch of n.characters){const prev=s.characters.filter(x=>x.id===ch.id).at(-1);if(prev&&prev.status!=='stale'&&prev.description===ch.description&&prev.want===ch.want&&prev.need===ch.need&&prev.arc===ch.arc&&prev.voice===ch.voice&&prev.name===ch.name)continue;if(prev)invalidate(s,prev.id,prev.version);s.characters.push({...base(ch.id),...ch,version:(prev?.version??0)+1,status:approve?'approved':'draft'});}
  for(const a of n.assets){const prev=s.assets.filter(x=>x.id===a.id).at(-1);if(prev&&prev.status!=='stale'&&prev.description===a.description&&prev.name===a.name&&JSON.stringify(prev.aliases)===JSON.stringify(a.aliases))continue;if(prev)invalidate(s,prev.id,prev.version);const owner=latest(s.characters).find(x=>x.id===a.ownerId);s.assets.push({...base(a.id,owner?[dep(owner)]:[]),...a,version:(prev?.version??0)+1,status:approve?'approved':'draft'});}
  const prevBible=s.bibles.filter(x=>x.id===n.bible.id).at(-1);s.bibles.push({...base(n.bible.id),...n.bible,version:(prevBible?.version??0)+1,status:approve?'approved':'draft'});s.brief=n.brief;
  for(const [i,ep] of n.episodes.entries()){
    let episode=latest(s.episodes).find(x=>x.id===ep.id);if(!episode){episode={...base(ep.id),title:ep.title,synopsis:ep.synopsis,order:i+1};s.episodes.push(episode);}
    episode.title=ep.title;episode.synopsis=ep.synopsis;episode.status=approve?'approved':'draft';
    await importScript(root,s,ep.id,ep.scriptText,approve,by);
  }
  s.reviews.push({...base(`narrative-review-${s.reviews.length+1}`),targetId:n.bible.id,targetVersion:s.bibles.at(-1)!.version,kind:'narrative',verdict:'pending',reviewer:n.review.reviewer,findings:[...n.review.findings,`Hook: ${n.review.hook}`,`Conflict: ${n.review.conflictProgression}`,`Rhythm: ${n.review.rhythm}`,`Ending: ${n.review.ending}`],createdAt:now()});
  s.diagnostics=s.diagnostics.filter(x=>x.stage!=='write');
  await mkdir(path.join(root,'narrative'),{recursive:true});
  await writeFile(path.join(root,'narrative','story-bible.md'),`# ${s.project.title}\n\nDerived read-only view; edit via Screenwriting response + import.\n\n${n.bible.premise}\n\nTheme: ${n.bible.theme}\nConflict: ${n.bible.conflict}\nEnding: ${n.bible.ending}\n\n${n.bible.decisions.join('\n')}\n\nNext: ${approve?'Production breakdown':'Review and approve draft'}\n`);
  await atomic(path.join(root,'narrative',`provenance-${s.bibles.at(-1)!.version}.json`),{authority:n.authority,skillsUsed:n.skillsUsed,commit:lock.sources[0].commit,by,at:now()});
}
export async function importScript(root:string,s:State,episodeId:string,text:string,approve:boolean,by:string){
  const ep=latest(s.episodes).find(x=>x.id===episodeId);if(!ep)throw Error(`Unknown episode ${episodeId}`);
  const id=`${episodeId}-SCRIPT`,previous=s.scripts.filter(x=>x.id===id).at(-1);
  if(previous?.sha256===sha(text)){if(approve)approveScript(s,previous.id,previous.version,by);return previous;}
  const script={...base(id),version:(previous?.version??0)+1,status:approve?'approved' as const:'draft' as const,episodeId,text,sha256:sha(text),authority:'screenwriting' as const,approval:approve?{by,at:now()}:undefined};
  s.scripts.push(script);if(approve)approveScript(s,script.id,script.version,by);
  const file=path.join(root,'narrative',`${id}.v${script.version}.fountain`);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,text,{flag:'wx'});
  return script;
}
export function approveScript(s:State,id:string,version:number,by:string){const sc=s.scripts.find(x=>x.id===id&&x.version===version);if(!sc)throw Error('Unknown script revision');for(const old of s.scripts)if(old.id===id&&old.version!==version&&old.status==='approved'){invalidate(s,old.id,old.version);old.status='stale';}sc.status='approved';sc.approval={by,at:now()};s.episodes.find(x=>x.id===sc.episodeId)!.scriptId=id;}
