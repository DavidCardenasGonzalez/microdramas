// Fetch documentation only from inspected MIT repositories; never execute upstream code.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const hash = x => createHash('sha256').update(x).digest('hex');
const sources = [
  ['screenwriting','jtydhr88/screenwriting-skills','51115f18d160aa8b2ac5813e4432b6f0b425358f','plugins/screenwriting/skills', ['sw-workflow','sw-premise-theme','sw-story-structure','sw-character-conflict','sw-scene-craft','sw-dialogue','sw-series-engine-bible','sw-series-structure','sw-format-adaptation']],
  ['drama','zenstory-ai/drama-skills','fdb7b7c58017e3eae64eca382c2a85ede368dab0','skills',['short-drama-assets','short-drama-storyboard','short-drama-image-prompts','short-drama-video-prompts','short-drama-review','short-drama-edit']],
  ['film','zhangzhangco/film-production-skills','47b2a6a432235e716fa2aa0d08eefae76fdb34fd','skills',['structure-screenplay','design-production-assets','plan-camera-shots','compile-generation-prompts','review-and-assemble']],
  ['director','0xhughs/director-skills','35ca0a2b4cd55b0668aa9ea0f40273324b774bb4','skills',['model-adaptation','prompt-iteration-and-diagnostics','style-cinematography-director']]
];
if (process.argv.includes('--verify')) {
  const lock = JSON.parse(await readFile('skills.lock.json','utf8'));
  for (const entry of lock.sources) for (const f of entry.files) {
    if(hash(await readFile(f.local))!==f.sha256) throw Error(`Modified vendor file: ${f.local}`);
  }
  console.log(`Verified ${lock.sources.reduce((n,s)=>n+s.files.length,0)} pinned documentation files`);
} else {
  const get = async u => { const r=await fetch(u,{headers:{'User-Agent':'ai-film-studio'}}); if(!r.ok) throw Error(`${r.status}: ${u}`); return r.text(); };
  const priorLock = await readFile('skills.lock.json','utf8').then(JSON.parse).catch(()=>({sources:[]}));
  const lock = {version:1, sources:[]};
  for (const [key,repo,commit,base,selected] of sources) {
    const raw=`https://raw.githubusercontent.com/${repo}/${commit}/`;
    const license = await get(raw+'LICENSE');
    if(!license.includes('MIT License') || !license.includes('Permission is hereby granted')) throw Error('Unreviewed license');
    const tree=JSON.parse(await get(`https://api.github.com/repos/${repo}/git/trees/${commit}?recursive=1`));
    const paths=tree.tree.filter(f=>f.type==='blob' && selected.some(s=>f.path.startsWith(`${base}/${s}/`)) && /\.(md|json|txt|yaml|yml)$/i.test(f.path)).map(f=>f.path);
    const entry={key,repo,commit,license:'MIT',selected,files:[]};
    for(const remote of ['LICENSE',...paths]) {
      const content=remote==='LICENSE'?license:await get(raw+remote);
      const local=`vendor/${key}/${remote==='LICENSE'?'LICENSE':remote.slice(base.length+1)}`;
      await mkdir(path.dirname(local),{recursive:true}); await writeFile(local,content);
      entry.files.push({remote,local,sha256:hash(content)});
    }
    lock.sources.push(entry); console.log(`${key}: ${selected.length} skills, ${entry.files.length} documentation files, ${commit}`);
  }
  lock.sources.push(...priorLock.sources.filter(entry=>!sources.some(([key])=>key===entry.key)));
  await writeFile('skills.lock.json',JSON.stringify(lock,null,2)+'\n');
}
