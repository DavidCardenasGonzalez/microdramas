import type { State } from './contracts.js';

// Policy comes from project state, never a second editable manifest.
export function productionPolicy(s:State){
 const simple=s.config.productionMode==='simple';
 return {
  mode:s.config.productionMode,
  guide:'docs/SIMPLE_PRODUCTION.md',
  directionGuide:'docs/AI_FILM_DIRECTION_PLAYBOOK.md',completionMode:s.config.completionMode,
  instruction:simple
   ? 'Prioritize the next renderable scene or shot. Apply the responsible skills once to the bounded scene, retain decisions in Studio contracts, and reuse unchanged approved plans, references, workflows and jobs. Complete planning, required assets and prompts in one working pass without intermediate creative approval requests. Read only necessary skill references; do not reopen completed stages or create extra reports. A technical retry or prompt correction with the same directed Shot does not require a new shot plan. Replan only changed action, camera, duration, routing or dependencies. Story changes require a Screenwriting revision. Official H3 uses minimal identity references and canonical textual continuity. For an explicitly requested composed-frame route only, a board is optional and a missing individual frame may be generated directly from approved references. Send each ready authorized shot before preparing unrelated scenes. Register its remote ID immediately. Follow completionMode: submit returns control; complete resumes through review and editing while honestly preserving unverified audiovisual QA.'
   : 'Use the official model-aware production workflow. Continue bounded narrative, direction, minimal references, generation, QA and assembly within the authorized scope; reuse approved decisions. No routine creative confirmation between stages.',
  sceneBoardRequired:false,
  safeguards:['Preserve approved script and dependency lineage.','Use real required references and verified adapter limits.','Keep scoped resource authorization and human approval of paid spending.','Never resubmit uncertain jobs or modify master workflows.','No music; no audiovisual approval without viewing and listening.']
 };
}
