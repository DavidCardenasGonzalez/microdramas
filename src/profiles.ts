import os from 'node:os';
import path from 'node:path';
import { Profile, Config } from './contracts.js';
const common={episodes:1,durationSeconds:[90,120],language:'en',audience:'general',genre:'drama',tone:'intimate',width:720,height:1280,fps:24,pacing:'motivated, varied; no filler',hooks:'engaging opening through image, action, emotion, situation or dialogue; questions optional; avoid repeated tricks',cliffhangers:'earned unresolved choice; resolution for standalone work',platforms:['vertical'],style:'cinematic',strictContinuity:true,maxShotSeconds:30,distribution:[]};
export const profiles:Record<string,Profile>={
 microdrama:Profile.parse({...common,format:'microdrama',episodes:15,languageLevel:'B1',hooks:'give a reason to keep watching after the first two seconds; any engaging visual, action, emotion, situation or dialogue; a question is optional'}),
 short:Profile.parse({...common,format:'short',durationSeconds:[180,600],width:1280,height:720,platforms:['festival']}),
 series:Profile.parse({...common,format:'series',episodes:6,durationSeconds:[1200,1800],width:1280,height:720,platforms:['streaming']}),
 feature:Profile.parse({...common,format:'feature',durationSeconds:[4800,7200],width:1920,height:1080,platforms:['cinema']}),
 novel:Profile.parse({...common,format:'novel',durationSeconds:[1,1],platforms:['written'],hooks:'organic reasons to keep reading through prose, curiosity or emotional involvement; questions optional',cliffhangers:'optional; serve the novel'})
};
export function defaultConfig(){const skill=path.join(os.homedir(),'.codex','skills','comfy-msr-video');return Config.parse({comfy:{url:'http://127.0.0.1:8000',root:'C:/ComfyUI',python:'C:/ComfyUI/.venv/Scripts/python.exe',msrRunner:path.join(skill,'scripts','run_msr_shots.py'),msrBase:path.join(skill,'assets','msr_15s_proven_base.json'),fluxBase:'C:/ComfyUI/user/flux3_research/api/FLUX3_Klein_1Ref_Director_12GB.api.json'}});}
