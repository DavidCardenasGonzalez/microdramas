import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { init } from '../src/studio.js';
import { importNarrative, repository } from '../src/narrative.js';
import { plan, prepareReferences, attachReference } from '../src/planning.js';
import { simulatedImage } from '../src/media.js';
import { compile, adapter, validateGraph } from '../src/adapters.js';
import { base, json, latest, uid, now, sha, atomic, save } from '../src/store.js';
import { type GenerationJob } from '../src/contracts.js';
const root=path.resolve(process.argv[2]??`productions/msr-preflight-${Date.now()}`);
const s=await init(root,'MSR STRUCTURAL PREFLIGHT — no video submitted','microdrama');s.project.profile.maxShotSeconds=12;
await importNarrative(root,s,await json(path.join(repository,'examples/the-spare-key/narrative.json')),true,'integration-test');plan(s,{},true);prepareReferences(s);
const image=path.join(root,'references','SIMULATED-preflight.png');await simulatedImage(image,s.config);
for(const ref of latest(s.references))await attachReference(root,s,ref.id,image,'synthetic structural fixture',true);
const shot=latest(s.shots)[0];shot.durationReason='Historical MSR structural fixture, never a video quality measurement.';const pack=await compile(root,s,shot,'mock');pack.adapter='msr';// remains simulated=true; only adapter.prepare is invoked below.
const job:GenerationJob={id:uid('PREFLIGHT'),shotId:shot.id,shotVersion:shot.version,episodeId:shot.episodeId,sceneId:shot.sceneId,package:pack,fingerprint:sha(JSON.stringify(pack)),state:'queued',attempts:0,maxAttempts:1,estimate:0,paid:false,reserved:false,createdAt:now(),updatedAt:now()};s.jobs.push(job);
let report:any;try{await adapter('msr').prepare(root,s,job);report={state:'passed',test:'existing MSR builder + live node/model validation',submitted:false,realModelInference:false,simulatedInputs:true,runner:s.config.comfy.msrRunner,workflow:path.join(root,'generation',job.id,'workflow.api.json')};}catch(e){job.state='blocked';job.error=(e as Error).message;report={state:'blocked',error:job.error,submitted:false,realModelInference:false};}
await save(root,s);await atomic(path.join(root,'integration-report.json'),report);await atomic(path.join(repository,'docs','msr-integration.detected.json'),{root,...report});console.log(JSON.stringify(report,null,2));
