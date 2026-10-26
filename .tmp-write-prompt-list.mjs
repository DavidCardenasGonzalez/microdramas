import fs from 'node:fs';
const root='productions/funny-girl-32';
const s=JSON.parse(fs.readFileSync(`${root}/.studio/state.json`,'utf8'));
const latest=(xs,id)=>xs.filter(x=>x.id===id).at(-1);
const jobs=s.jobs.filter(j=>j.episodeId==='EP002'&&j.shotId?.includes('-D')&&j.shotVersion===2).sort((a,b)=>a.shotId.localeCompare(b.shotId));
const sections=['# EP002 — prompts exactos de la prueba v2','',`Generados desde los paquetes preparados de ComfyUI el ${new Date().toISOString()}. Cada elemento incluye el ID remoto y el prompt exacto enviado. Los resultados siguen en generación; esto no implica QA audiovisual.`, ''];
for(const j of jobs){const shot=latest(s.shots,j.shotId);sections.push(`## ${j.shotId} — ${shot.dialogue[0]?.speakerId} — ${j.package.durationSeconds.toFixed(3)} s`,'',`- Job: ${j.id}`,`- Comfy prompt_id: ${j.remoteId??'sin ID'}`,`- Línea literal: ${shot.dialogue[0]?.text??'(sin diálogo)'}`,'','```text',j.package.prompt,'```','');}
const out=`${root}/generation/EP002-dialogue-test-v2-prompts.md`;
fs.writeFileSync(out,sections.join('\n'),'utf8');
console.log(JSON.stringify({file:out,count:jobs.length,withRemoteIds:jobs.filter(x=>x.remoteId).length,size:fs.statSync(out).size}));
