import { spawn } from 'node:child_process';
import { access, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { type Config } from './contracts.js';
export async function command(exe:string,args:string[],options:{timeoutMs?:number;allowFailure?:boolean;cwd?:string}={}):Promise<{code:number;stdout:string;stderr:string}>{
 return new Promise((resolve,reject)=>{const child=spawn(exe,args,{shell:false,windowsHide:true,cwd:options.cwd});let stdout='',stderr='';let timer:NodeJS.Timeout|undefined;child.stdout.on('data',x=>stdout=(stdout+x).slice(-2000000));child.stderr.on('data',x=>stderr=(stderr+x).slice(-2000000));child.on('error',reject);child.on('close',code=>{if(timer)clearTimeout(timer);const r={code:code??1,stdout,stderr};if(r.code&&!options.allowFailure)reject(Error(`${path.basename(exe)} exited ${r.code}: ${stderr.slice(-4000)}`));else resolve(r);});if(options.timeoutMs)timer=setTimeout(()=>{child.kill();reject(Error(`Process timeout: ${exe}`));},options.timeoutMs);});
}
export async function findFFmpeg(config:Pick<Config,'ffmpeg'>){
 const candidates=[process.env.STUDIO_FFMPEG,config.ffmpeg,'ffmpeg','C:/ComfyUI/.venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'];
 for(const exe of candidates.filter((x):x is string=>!!x))try{await command(exe,['-version']);return exe;}catch{}
 throw Error('FFmpeg unavailable. Set STUDIO_FFMPEG or config.ffmpeg to an existing executable.');
}
export type MediaInfo={width:number;height:number;fps:number;duration:number;hasAudio:boolean;audioStreams:number;method:string};
export async function probe(file:string,config:Pick<Config,'ffmpeg'|'ffprobe'>):Promise<MediaInfo>{
 if(config.ffprobe){const r=await command(config.ffprobe,['-v','error','-show_streams','-show_format','-of','json',file]);const data=JSON.parse(r.stdout),v=data.streams.find((x:any)=>x.codec_type==='video');if(!v)throw Error('Video stream missing');const [a,b]=v.avg_frame_rate.split('/').map(Number);return {width:v.width,height:v.height,fps:a/(b||1),duration:Number(data.format.duration??v.duration),hasAudio:data.streams.some((x:any)=>x.codec_type==='audio'),audioStreams:data.streams.filter((x:any)=>x.codec_type==='audio').length,method:'ffprobe'};}
 const exe=await findFFmpeg(config);const r=await command(exe,['-hide_banner','-i',file],{allowFailure:true});const stream=r.stderr.split('\n').find(x=>/Stream.*Video:/.test(x));if(!stream)throw Error('Cannot read video stream');const size=stream.match(/\b(\d{2,5})x(\d{2,5})\b/);const fps=stream.match(/([\d.]+) fps/);const duration=r.stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);if(!size||!fps||!duration)throw Error('Cannot parse media metadata; configure FFprobe for this format');return {width:+size[1],height:+size[2],fps:+fps[1],duration:+duration[1]*3600+ +duration[2]*60+ +duration[3],hasAudio:/Stream.*Audio:/.test(r.stderr),audioStreams:(r.stderr.match(/Stream.*Audio:/g)||[]).length,method:'ffmpeg-header (duration rounded to 0.01s)'};
}
export async function checkMedia(file:string,expected:{width:number;height:number;fps:number;duration?:number},config:Pick<Config,'ffmpeg'|'ffprobe'>){
 const ff=await findFFmpeg(config),info=await probe(file,config);const findings:string[]=[];
 if(info.width!==expected.width||info.height!==expected.height)findings.push(`Resolution ${info.width}x${info.height}; expected ${expected.width}x${expected.height}`);
 if(Math.abs(info.fps-expected.fps)>0.02)findings.push(`FPS ${info.fps}; expected ${expected.fps}`);
 if(expected.duration&&Math.abs(info.duration-expected.duration)>Math.max(0.12,2/expected.fps))findings.push(`Duration ${info.duration}; expected ${expected.duration}`);
 const decode=await command(ff,['-hide_banner','-v','error','-err_detect','explode','-i',file,'-f','null','-'],{allowFailure:true,timeoutMs:180000});if(decode.code||decode.stderr.trim())findings.push(`Decode failure: ${decode.stderr.slice(-1000)}`);
 const detect=await command(ff,['-hide_banner','-i',file,'-vf','blackdetect=d=0.25:pix_th=0.10,freezedetect=n=-50dB:d=1','-an','-f','null','-'],{allowFailure:true,timeoutMs:180000});
 const flags=detect.stderr.split('\n').filter(x=>/black_start:|freeze_start:/.test(x)).map(x=>x.trim());
 return {info,pass:findings.length===0,findings,temporalFlags:flags,visualReview:'pending' as const};
}
export async function simulatedVideo(file:string,pack:{width:number;height:number;fps:number;durationSeconds:number;shotId:string},config:Config){const ff=await findFFmpeg(config);await mkdir(path.dirname(file),{recursive:true});await command(ff,['-y','-hide_banner','-loglevel','error','-f','lavfi','-i',`testsrc2=size=${pack.width}x${pack.height}:rate=${pack.fps}`,'-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t',String(pack.durationSeconds),'-vf',`drawtext=text='SIMULATED ${pack.shotId}':fontsize=18:fontcolor=white:box=1:boxcolor=black@0.8:x=10:y=10`,'-c:v','libx264','-preset','ultrafast','-pix_fmt','yuv420p','-c:a','aac','-shortest',file],{timeoutMs:120000});}
export async function simulatedImage(file:string,config:Config){const ff=await findFFmpeg(config);await mkdir(path.dirname(file),{recursive:true});await command(ff,['-y','-hide_banner','-loglevel','error','-f','lavfi','-i','testsrc2=size=360x640:rate=1','-vf',"drawtext=text='SIMULATED REFERENCE':fontsize=20:fontcolor=white:x=10:y=20",'-frames:v','1',file]);}
