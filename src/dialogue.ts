import type { State, Shot } from './contracts.js';

/** Broad screening estimates, not a universal acting speed or speech synthesizer. */
export function speechTiming(text:string){
 const words=text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu)?.length??0;
 return {words,minSeconds:words/6,maxSeconds:Math.max(3,words/1.2+0.8)};
}

export function validateDialogue(s:State,shot:Shot){
 const p=shot.referencePlan;
 if(!p)throw Error('Dialogue direction requires a timed Reference Plan');
 for(const line of shot.dialogue){
  const a=p.dialogueStaging?.find(x=>x.beatId===line.beatId);
  if(!line.text.trim()||!a?.language?.trim()||!a.intent?.trim())throw Error('Each spoken intervention requires exact text, project language and observable interpretive intent');
  if(a.language!==s.project.profile.language)throw Error('Dialogue language must match the configured project language');
  const timing=speechTiming(line.text),duration=a.outSeconds-a.inSeconds;
  if((duration<timing.minSeconds||duration>timing.maxSeconds)&&!a.timingReason?.trim())throw Error(`Implausible speech window for ${line.beatId}; revise timing or explain deliberate delivery in timingReason, placing motivated silent action outside speech`);
 }
 for(const part of p.shots){
  const native=p.dialogueStaging?.some(a=>a.shotId===part.id&&a.strategy==='on-camera');
  if(!native&&/\b(speaks?|speaking|says?|talks?|talking|whispers?|whispering|converses?|conversing|mouths? words)\b/i.test(`${part.action} ${part.performance??''}`))throw Error('Unspecified speech in visual direction: supply exact staged words or direct silent listening with independent audio');
 }
}

/** Keep model-visible quotation exclusively for actual native interventions. */
export function validateSpokenText(shot:Shot,prompt:string){
 const counts=new Map<string,number>();
 for(const line of shot.dialogue){
  const staged=shot.referencePlan?.dialogueStaging?.find(a=>a.beatId===line.beatId);
  const quoted=`“${line.text.replace(/\s+/g,' ').trim()}”`;
  if(!staged||staged.strategy==='on-camera')counts.set(quoted,(counts.get(quoted)??0)+1);
 }
 let visual=prompt;
 for(const [quoted,count] of counts){
  if(prompt.split(quoted).length-1!==count)throw Error('Each native source intervention must appear exactly once, only as attributed quoted dialogue; revise duplicated visual/state text');
  visual=visual.split(quoted).join('');
 }
 if(/“[^”]+”|"[^"\n]+"/.test(visual))throw Error('Unassigned quoted text in generation directions could become speech; keep titles/analysis in metadata and offscreen words outside video prompts');
}
