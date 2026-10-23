import path from 'node:path';
import { type State } from './contracts.js';
import { latest, atomic } from './store.js';
import { scoped, type Scope } from './planning.js';
import { repository } from './narrative.js';
export const skillRoutes:Record<string,[string,string[]]>={
 breakdown:['film',['structure-screenplay']],assets:['film',['design-production-assets']],shots:['film',['plan-camera-shots']],prompts:['film',['compile-generation-prompts']],review:['film',['review-and-assemble']],
 microdramaReview:['drama',['short-drama-review']],storyboard:['drama',['short-drama-storyboard']],imagePrompts:['drama',['short-drama-image-prompts']],videoPrompts:['drama',['short-drama-video-prompts']],edit:['drama',['short-drama-edit']],
 model:['director',['model-adaptation']],diagnostics:['director',['prompt-iteration-and-diagnostics']],style:['director',['style-cinematography-director']]
};
export function taskPacket(s:State,stage:string,scope:Scope){const route=skillRoutes[stage];if(!route)throw Error(`Unknown production task ${stage}`);if(!scope.episode&&!scope.shot&&!scope.scene)throw Error('Bound task by --episode, --scene or --shot');
 const shots=scoped(latest(s.shots),scope);const episodeIds=new Set(shots.map(x=>x.episodeId));if(scope.episode)episodeIds.add(scope.episode);const beats=latest(s.beats).filter(b=>shots.some(sh=>sh.beatIds.includes(b.id)));
 const assetIds=new Set(shots.flatMap(sh=>sh.assetIds));
 return {kind:'codex-production-task',stage,scope,project:{id:s.project.id,title:s.project.title,profile:s.project.profile},skills:route[1].map(name=>({name,path:path.join(repository,'vendor',route[0],name,'SKILL.md')})),
  approvedStoryAdapter:{authority:'screenwriting',bible:latest(s.bibles).map(b=>({id:b.id,version:b.version,premise:b.premise,theme:b.theme})),note:'Replaces shape-story-blueprint with approved facts. These skill docs are methodological inputs; normalize results to studio schemas rather than maintaining a second editable project.'},
  scripts:scope.shot||scope.scene?undefined:s.scripts.filter(x=>x.status==='approved'&&episodeIds.has(x.episodeId)),shots,beats,assets:latest(s.assets).filter(x=>assetIds.has(x.id)),references:latest(s.references).filter(x=>shots.some(sh=>sh.referenceIds.includes(x.id))),
  takes:latest(s.takes).filter(t=>shots.some(sh=>sh.id===t.shotId)),
  restrictions:['No new story events or dialogue. Return narrative feasibility findings to Screenwriting.','Exact source spans and existing IDs are authoritative.','Never claim a visual or listening check not performed.','No provider actions from upstream skill scripts; use studio adapters and approvals.'],
  outputSchemas:{shot:path.join(repository,'schemas/Shot.schema.json'),review:path.join(repository,'schemas/Review.schema.json'),timeline:path.join(repository,'schemas/Timeline.schema.json')}
 };
}
export async function persistTask(root:string,s:State,stage:string,scope:Scope){const packet=taskPacket(s,stage,scope);const file=path.join(root,'requests',`${stage}-${scope.shot??scope.scene??scope.episode}.json`);await atomic(file,packet);return {file,packet};}
