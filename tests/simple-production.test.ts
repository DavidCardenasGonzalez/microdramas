import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Config } from '../src/contracts.js';
import { init, progress } from '../src/studio.js';
import { importNarrative, narrativeRequest, repository } from '../src/narrative.js';
import { plan, prepareReferences, attachReference } from '../src/planning.js';
import { taskPacket } from '../src/tasks.js';
import { json, latest, save, load } from '../src/store.js';
import { enqueue, approveJobs } from '../src/generation.js';
import { compile } from '../src/adapters.js';

async function fixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),'simple-production-'));
 const s=await init(root,'Simple policy fixture','microdrama');s.project.profile.maxShotSeconds=12;
 await importNarrative(root,s,await json(path.join(repository,'examples/the-spare-key/narrative.json')),true,'fixture');
 plan(s,{},false);return {root,s};
}

test('production handoff advances from breakdown to skill direction to prompts without automatic approval',async()=>{
 const {s}=await fixture();const scope={episode:'EP001'};
 const empty=structuredClone(s);empty.shots=[];
 assert.equal(taskPacket(empty,'production',scope).stage,'breakdown');
 const directed=taskPacket(s,'production',scope);
 assert.equal(directed.stage,'shots');assert.equal(directed.skills[0].name,'plan-camera-shots');
 assert.ok(directed.shots.every(sh=>sh.status!=='approved'));
 for(const sh of s.shots){sh.status='approved';sh.durationReason='Complete the source beat at its directed rhythm.';}
 s.config.productionMode='simple';
 const next=taskPacket(s,'production',scope);
 assert.equal(next.stage,'prompts');assert.equal(next.requestedStage,'production');
 assert.equal(next.shotPlanningContract!.imageContinuityContract!.mandatory,false);
 assert.match(next.shotPlanningContract!.imageContinuityContract!.workflow,/individual frame/);
 s.config.productionMode='standard';
 assert.equal(taskPacket(s,'prompts',scope).shotPlanningContract!.imageContinuityContract!.mandatory,false);
 assert.throws(()=>taskPacket(s,'production',{}),/Bound task/);
});

test('CLI mode persists project-wide without invalidation, supports dry run, and rejects invalid modes',async()=>{
 const {root,s}=await fixture();await save(root,s);
 const before=await readFile(path.join(root,'.studio/state.json'),'utf8');
 const cli=(...args:string[])=>spawnSync(process.execPath,[path.join(repository,'bin/studio.mjs'),'-p',root,'config',...args],{encoding:'utf8'});
 assert.equal(cli('--production-mode','simple','--dry-run').status,0);
 assert.equal(await readFile(path.join(root,'.studio/state.json'),'utf8'),before);
 assert.equal(cli('--production-mode','simple').status,0);
 const after=await load(root);assert.equal(after.config.productionMode,'simple');
 assert.equal(progress(after).productionMode,'simple');
 const persisted=JSON.parse(before);
 for(const key of ['scripts','shots','references','jobs','approvals'] as const)assert.deepEqual(after[key],persisted[key]);
 const stable=await readFile(path.join(root,'.studio/state.json'),'utf8');
 assert.notEqual(cli('--production-mode','unrestricted').status,0);
 assert.equal(await readFile(path.join(root,'.studio/state.json'),'utf8'),stable);
 assert.equal(cli('--production-mode','standard').status,0);
 assert.equal((await load(root)).config.productionMode,'standard');
 const legacy={...s.config} as Record<string,unknown>;delete legacy.productionMode;
 assert.equal(Config.parse(legacy).productionMode,'standard');
 const request=await narrativeRequest(root,after,'A simple scene.');
 assert.equal(request.productionPolicy.mode,'simple');
});

test('simple production reuses jobs and preserves plan, reference, real-model and paid approval gates',async()=>{
 const {root,s}=await fixture();s.config.productionMode='simple';const shot=s.shots[0];const scope={shot:shot.id};
 await assert.rejects(enqueue(root,s,'mock',scope),/durationReason/);
 shot.durationReason='Complete only the directed source beat.';
 await assert.rejects(enqueue(root,s,'mock',scope),/not approved/);
 shot.status='approved';prepareReferences(s,scope);
 await assert.rejects(enqueue(root,s,'mock',scope),/reference not approved/);
 const file=path.join(root,'SIMULATED-reference.txt');await writeFile(file,'Contract fixture only. Not a real image.');
 for(const ref of latest(s.references))await attachReference(root,s,ref.id,file,'synthetic-contract-fixture',true);
 const [job]=await enqueue(root,s,'mock',scope);assert.ok(job);
 assert.equal((await enqueue(root,s,'mock',scope)).length,0);
 assert.equal(shot.version,1);
 assert.equal(taskPacket(s,'prompts',scope).jobs[0].id,job.id);
 await assert.rejects(compile(root,s,shot,'msr'),/Simulated reference/);
 job.paid=true;
 assert.throws(()=>approveJobs(s,scope,{local:true,paid:false,maxCost:0,reason:'fixture'}),/Paid jobs require/);
});
