import path from 'node:path';
import { init } from '../src/studio.js';
import { importNarrative, repository } from '../src/narrative.js';
import { plan, prepareReferences, planningArtifacts } from '../src/planning.js';
import { directSpareKey } from '../src/example-direction.js';
import { save, json, atomic } from '../src/store.js';
const root=path.resolve(process.argv[2]??'productions/first-microdrama');const s=await init(root,'The spare key','microdrama');s.project.profile.episodes=1;s.project.profile.durationSeconds=[30,60];await importNarrative(root,s,await json(path.join(repository,'examples/the-spare-key/narrative.json')),true,'Codex / original authorized production example');plan(s,{},false);directSpareKey(s);prepareReferences(s);await planningArtifacts(root,s);await save(root,s);console.log(JSON.stringify({root,shots:s.shots.map(x=>({id:x.id,seconds:x.durationSeconds})),references:s.references.map(x=>({id:x.id,description:x.description})),next:'Attach four reviewed real references, then generate --adapter msr --prepare-only; no paid calls or GPU video runs have occurred.'},null,2));
