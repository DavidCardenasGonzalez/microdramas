import json, subprocess
from pathlib import Path

root = Path(r'C:\Users\AMD RYZEN\OneDrive\Documentos\ChatGPT\microdramas\productions\la-novia-del-vampiro')
ffmpeg = r'C:\ComfyUI\.venv\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe'
base = root / 'review-drafts/EP001-REBUILD-C01-C03-social-preview-v1.mp4'
clip4 = root / 'media/higgsfield/EP001-REBUILD-C04-v2.mp4'
out = root / 'review-drafts/EP001-CHAPTER1-social-cut-v1-preview.mp4'
# Preserve the accepted C01-C03 social cut. Trim only C04 silences, keeping
# brief turn-taking gaps and a slightly longer reaction after Lucian's answer.
ranges = [(0.92,2.402),(3.111,3.840),(4.683,6.045),(6.462,7.375),(8.167,9.257),(9.646,11.303),(12.390,13.284),(14.099,25.04)]
speed=1.10
filters=['[0:v]fps=24,setsar=1[v0]','[0:a]asetpts=PTS-STARTPTS[a0]']
labels=['[v0][a0]']
for i,(start,end) in enumerate(ranges):
    filters.append(f'[1:v]trim=start={start}:end={end},setpts=(PTS-STARTPTS)/{speed},fps=24,setsar=1[v{i+1}]')
    filters.append(f'[1:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,atempo={speed}[a{i+1}]')
    labels.append(f'[v{i+1}][a{i+1}]')
filters.append(''.join(labels)+f'concat=n={len(labels)}:v=1:a=1[v][a]')
cmd=[ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(base),'-i',str(clip4),'-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-c:v','libx264','-crf','20','-preset','fast','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',str(out)]
subprocess.run(cmd,check=True)
manifest={
  'title':'The Blackwood Bride — Episode 1 social cut',
  'status':'assembled preview; audiovisual approval pending',
  'sources':['EP001-REBUILD-C01-v1.mp4','EP001-REBUILD-C02-v1.mp4','EP001-REBUILD-C03-v3.mp4','EP001-REBUILD-C04-v2.mp4'],
  'edit':'C01-C03 reuse the creator-accepted social preview unchanged. C04 is cut only within measured silent gaps, preserving short pauses and the reaction after the death reveal; dialogue and action are retained. C04 plays at 1.10x.',
  'c04_source_ranges_seconds':ranges,
  'music':'none added; no-music compliance not independently confirmed by direct listening',
  'qa':{'technical':'pending probe/decode check','visual':'sampled C04 contact sheet looks coherent; final edit not fully reviewed','dialogue_speaker_ownership_and_music':'pending direct listening; Whisper transcription suggests one uncertain pronoun in the second question'},
  'output':str(out)
}
(root/'review-drafts/EP001-CHAPTER1-social-cut-v1-preview.manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(out)
