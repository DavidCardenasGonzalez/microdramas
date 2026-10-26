import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const project='productions/la-novia-del-vampiro';
const video=path.resolve(project+'/media/higgsfield/EP001-REBUILD-C01-v1.mp4');
const record={
  jobId:'41d8ea8a-6e2e-4a27-93f9-d529c826ab20', model:'kling4_0', type:'video', status:'completed',
  approvedCostCredits:6, estimatedCostCredits:6, resolution:'720p', aspectRatio:'9:16', durationRequestedSeconds:12,
  resultUrl:'https://d8j0ntlcm91z4.cloudfront.net/user_39akxBlIut89neqKdFmgsLN7hTl/hf_20261024_163834_41d8ea8a-6e2e-4a27-93f9-d529c826ab20.mp4',
  localFile:video, sha256:crypto.createHash('sha256').update(fs.readFileSync(video)).digest('hex'),
  referenceMediaIds:['359079f2-3c06-40c0-9242-ededb3d82967','bdd6332e-9852-46a6-b2c4-23e094de2918'],
  exactVoiceover:'Tonight, Count Lucian Blackwood has come to choose a bride.',
  review:{technical:'pass: 720x1280, 24 fps, 12.04 seconds, one audio stream, full decode, no black/freeze flags', visual:'reviewed sampled frames at 0.5, 4, 8, and 11.5 seconds; sisters remain back-facing and holding hands; Lucian faces the closed gate; no visible mouth speaking during VO', spokenWordsAndMusic:'pending direct listening'},
  next:'Listen to this clip before generating C02; do not proceed if spoken line, voice-over ownership, or unwanted music is wrong.'
};
const out=project+'/generation/higgsfield/EP001-rebuild-C01-v1.json';
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(record,null,2)+'\n');
console.log(out+'\n'+record.sha256);
