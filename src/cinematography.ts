import { CinematicStyle, type State, type Shot } from './contracts.js';
import { invalidate, latest } from './store.js';

export function importCinematicStyle(s:State,input:unknown){
 const style=CinematicStyle.parse(input);
 const old=latest(s.cinematicStyles).find(x=>x.id===style.id);
 const content=(x:typeof style)=>JSON.stringify({...x,version:0,status:'approved',deps:[]});
 if(old&&content(old)===content(style))return old;
 if(old){invalidate(s,old.id,old.version);old.status='stale';}
 style.version=Math.max(0,...s.cinematicStyles.filter(x=>x.id===style.id).map(x=>x.version))+1;
 style.status='approved';style.deps=[];s.cinematicStyles.push(style);return style;
}

export function styleForShot(s:State,shot:Shot){
 return shot.cinematicStyle?s.cinematicStyles.find(x=>x.id===shot.cinematicStyle!.id&&x.version===shot.cinematicStyle!.version&&x.status==='approved'):undefined;
}

export function validateStyle(s:State,shot:Shot){
 const style=styleForShot(s,shot);
 if(!style||!shot.deps.some(d=>d.id===style.id&&d.version===style.version))throw Error('Approved versioned cinematicStyle and its dependency required; import with cinematic-style --import');
 return style;
}

/** Genre comes from the production, never a thriller default. No framing template. */
export function cinematicOpening(s:State,shot?:Shot){
 const style=shot?styleForShot(s,shot):latest(s.cinematicStyles).at(-1);
 const genre=style?`${style.genre}, ${style.subgenre}`:s.project.profile.genre;
 const text=(x:string)=>x.trim().replace(/[.\s]+$/,'');
 return [
  `Ultra-photorealistic scene from a premium Hollywood ${text(genre)} feature film. Prestige studio production quality with realistic skin detail and psychologically grounded performances.`,
  ...(style?[
   `Aesthetic approach: ${text(style.aestheticReferences)}. Color and finish: ${text(style.colorPalette)}.`,
   `Cinematography and lighting: ${text(style.lighting)}. Performance: ${text(style.performanceStyle)}.`,
   `Editorial rhythm: ${text(style.rhythm)}. Camera language: ${text(style.cameraLanguage)}.`,
   `Realism: ${text(style.realism)}. Genre treatment: ${text(style.genreTreatment)}.`
  ]:[`Production treatment: ${text(s.project.profile.style)}; ${text(s.project.profile.tone)} tone, ${text(s.project.profile.pacing)} rhythm.`]),
  ...(shot?.direction?[`Scene treatment (${text(shot.direction.genre)}): ${text(shot.direction.visualTreatment)}.`]:[])
 ].join('\n');
}

