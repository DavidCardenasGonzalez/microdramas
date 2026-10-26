import { mkdir, readFile, writeFile, rename, open, unlink, stat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { State, type State as StudioState } from './contracts.js';
export const now=()=>new Date().toISOString();
export const sha=(x:string|Buffer)=>createHash('sha256').update(x).digest('hex');
export const uid=(prefix:string)=>`${prefix}-${randomUUID().slice(0,12)}`;
export const base=(id:string,deps:{id:string;version:number}[]=[])=>({id,version:1,status:'planned' as const,deps});
export const latest=<T extends {id:string;version:number;status?:string}>(items:T[])=>[...items.reduce((map,x)=>{if((map.get(x.id)?.version??0)<=x.version)map.set(x.id,x);return map;},new Map<string,T>()).values()].filter(x=>x.status!=='stale');
export const dep=(x:{id:string;version:number})=>({id:x.id,version:x.version});
export async function json(file:string){return JSON.parse((await readFile(file,'utf8')).replace(/^\uFEFF/,''));}
export async function atomic(file:string,data:unknown){await mkdir(path.dirname(file),{recursive:true});const tmp=`${file}.${randomUUID()}.tmp`;await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,file);}
export async function fileSha(file:string){return sha(await readFile(file));}
export function inside(root:string,relative:string){const out=path.resolve(root,relative);if(out!==path.resolve(root)&&!out.startsWith(path.resolve(root)+path.sep))throw Error(`Path outside project: ${relative}`);return out;}
export const statePath=(root:string)=>path.join(root,'.studio','state.json');
export async function load(root:string){const s=State.parse(await json(statePath(root)));await verifyScripts(s);return s;}
export async function verifyScripts(s:StudioState){for(const script of s.scripts)if(sha(script.text)!==script.sha256)throw Error(`Script integrity violation: ${script.id} v${script.version}`);}
export async function save(root:string,s:StudioState){State.parse(s);await verifyScripts(s);s.revision++;await atomic(statePath(root),s);}
export async function transaction<T>(root:string,fn:(s:StudioState)=>Promise<T>):Promise<T>{
  const lock=path.join(root,'.studio','write.lock');await mkdir(path.dirname(lock),{recursive:true});
  let h;try{h=await open(lock,'wx');}catch{
    const old=await json(lock).catch(()=>null);let alive=true;
    if(old?.pid){try{process.kill(old.pid,0);}catch(e){alive=(e as NodeJS.ErrnoException).code!=='ESRCH';}}
    if(alive)throw Error('Project has an active writer. Retry after it finishes.');
    await unlink(lock);h=await open(lock,'wx');
  }
  try{await h.writeFile(JSON.stringify({pid:process.pid,at:now()}));const s=await load(root);const result=await fn(s);await save(root,s);return result;}finally{await h.close();await unlink(lock).catch(()=>{});}
}
export function invalidate(s:StudioState,id:string,version:number){
  const affected=new Set<string>([`${id}@${version}`]);
  const collections=[s.scenes,s.beats,s.cinematicStyles,s.sequencePlans,s.sequenceContinuities,s.shots,s.assets,s.references,s.takes,s.reviews,s.timelines,s.exports] as {id:string;version:number;status:string;deps:{id:string;version:number}[]}[][];
  let changed=true;while(changed){changed=false;for(const list of collections)for(const a of list)if(a.status!=='stale'&&a.deps.some(d=>affected.has(`${d.id}@${d.version}`))){a.status='stale';affected.add(`${a.id}@${a.version}`);changed=true;}}
  for(const j of s.jobs)if(affected.has(`${j.shotId}@${j.shotVersion}`))j.state='stale';
  for(const shot of s.shots)if(shot.status==='stale'){shot.selectedTakeId=undefined;shot.finalState='stale';}
  return [...affected];
}
export function diagnostic(s:StudioState,stage:string,message:string,resolution:string,targetId?:string){const existing=s.diagnostics.find(x=>x.stage===stage&&x.message===message&&x.targetId===targetId);if(!existing)s.diagnostics.push({id:uid('diag'),stage,targetId,severity:'blocker',message,resolution,createdAt:now()});}
export async function exists(file:string){return stat(file).then(x=>x.isFile(),()=>false);}
