import fs from 'node:fs';
const root='productions/funny-girl-32';
const s=JSON.parse(fs.readFileSync(`${root}/.studio/state.json`,'utf8'));
const latest=(xs,id)=>xs.filter(x=>x.id===id).at(-1);
const episode='EP002';
const scenes=s.scenes.filter(x=>x.episodeId===episode&&x.status==='approved');
const beats=s.beats.filter(x=>x.episodeId===episode&&x.status==='approved');
const script=s.scripts.filter(x=>x.episodeId===episode&&x.status==='approved').at(-1);
const style=s.project.profile.style;
const sceneCfg={
 'EP002-SC001':{location:'LOC-MAGAZINE-OFFICE',locationRef:'REF-LOC-MAGAZINE-OFFICE',time:'day',wardrobe:{MOLLY:'Molly wears her casual office outfit: a plain white sleeveless top and dark jeans.',CLAIRE:'Claire wears her office outfit: a navy blazer over an ivory blouse with dark tailored trousers.'}},
 'EP002-SC002':{location:'LOC-BAR-CORNER',locationRef:'REF-LOC-BAR-CORNER',time:'night',wardrobe:{MOLLY:'Molly wears her black premiere dress and evening bag.',CLAIRE:'Claire wears her navy satin premiere dress and simple jewelry.'}},
 'EP002-SC003':{location:'LOC-THEATER-FOYER',locationRef:'REF-LOC-THEATER-FOYER',time:'night',wardrobe:{MOLLY:'Molly wears her black premiere dress and carries her small evening bag.',CLAIRE:'Claire wears her navy satin premiere dress and simple jewelry.'}}
};
const dialogueByScene=new Map();
for(const b of beats.filter(x=>x.kind==='dialogue')){const a=dialogueByScene.get(b.sceneId)||[];a.push(b);dialogueByScene.set(b.sceneId,a)}
for(const a of dialogueByScene.values())a.sort((x,y)=>x.source.start-y.source.start);
const extra={
 'EP002-SC001-B-3639d907-1':'EP002-SC001-B-f52483a7-1',
 'EP002-SC001-B-9cddbc93-1':'EP002-SC001-B-85e09b73-1',
 'EP002-SC001-B-1e626ecf-1':'EP002-SC001-B-df7a5c0b-1',
 'EP002-SC002-B-434eba57-1':'EP002-SC002-B-fb10ff77-1',
 'EP002-SC002-B-db47f978-1':'EP002-SC002-B-7f183058-1',
 'EP002-SC003-B-570bea35-1':'EP002-SC003-B-f191ace8-1',
 'EP002-SC003-B-310652b4-1':'EP002-SC003-B-a94bff66-1',
 'EP002-SC003-B-afcdd16d-1':'EP002-SC003-B-c8dc1cda-1',
 'EP002-SC003-B-d8178180-1':'EP002-SC003-B-c8dc1cda-1',
 'EP002-SC003-B-d2b866d9-1':'EP002-SC003-B-c8dc1cda-1',
 'EP002-SC003-B-328d7a6d-1':'EP002-SC003-B-c8dc1cda-1'
};
const beatsForLine=new Map();
for(const line of beats.filter(x=>x.kind==='dialogue'))beatsForLine.set(line.id,[line.id]);
for(const [action,target] of Object.entries(extra))beatsForLine.get(target).push(action);
const allowed=[5,22,39,56,73,90,107];
const duration=(n)=>{const candidates=allowed.map(x=>x/24).filter(x=>x>=5/24);const inRange=candidates.filter(x=>n/x>=2&&n/x<=2.5);if(inRange.length)return Math.min(...inRange);return candidates.reduce((best,x)=>Math.abs(n/x-2.25)<Math.abs(n/best-2.25)?x:best,candidates[0]);};
const mood={
 'Two men? At the wedding?':'Claire is genuinely surprised and curious, with a quick, intimate reaction; not melodramatic.',
 'Keep your voice down.':'Molly gives a playful, conspiratorial warning with a small knowing smile.',
 'What happened?':'Claire asks with warm, focused curiosity and responsive eye contact.',
 'I left.':'Molly answers dryly and plainly, with a tiny self-aware smile.',
 'You?':'Claire gives a brief amused, incredulous reaction, warm rather than flat.',
 'You got promoted again?':'Molly’s smile carries friendly teasing and a hint of envy.',
 'Yes. And I still hate my job.':'Claire is candid and lightly exasperated, then softens with humor.',
 'I work so hard. My boss still hates me.':'Molly is self-deprecating and frustrated, with lively timing and an expressive face.',
 'Come with me tonight.':'Claire invites Molly with easy warmth and genuine enthusiasm.',
 'Another party?':'Molly sounds skeptical but playful, not bored or robotic.',
 'A movie premiere.':'Claire answers with a bright, matter-of-fact lift.',
 'Maybe someone will notice me there.':'Molly lets hopeful vanity peek through a wry, self-mocking smile.',
 'You were gone a long time.':'Claire is attentive and mildly concerned, speaking naturally, not accusing.',
 'I needed a break.':'Molly is evasive but casual; a quick forced smile gives her away.',
 'Did you use cocaine?':'Claire asks quietly and directly, with concern, not judgment.',
 'Just a little. I still have some.':'Molly is guarded and matter-of-fact, with natural conversational rhythm.',
 'Keep it. I only want a drink.':'Claire responds firmly but gently, keeping her eyes on Molly.',
 "Then drink. We're going to be late.":'Molly is impatient in a playful, familiar way, then lets the tension pass.',
 'Is your foot bleeding?':'Claire’s concern is immediate and sincere; let it register in her eyes.',
 "I don't know. She stepped right on it.":'Molly is uncomfortable and trying to shrug it off; her face shows a small wince.',
 'Do you need a doctor?':'Claire asks steadily, worried but not panicked.',
 'No. I need the bathroom.':'Molly is urgent and uncomfortable, trying to keep her voice composed.',
 'The movie is starting.':'Claire gives a gentle reminder and glances toward the screening room.',
 "I'll be right there.":'Molly gives a reassuring, slightly too-bright smile to hide that she feels unwell.',
 'I wanted them to see me. Now I wanted to hide.':'Molly’s inner voice is vulnerable and reflective, with restrained emotion; her lips remain still.'
};
const actionText={
 'EP002-SC001-B-3639d907-1':'Begin in the Los Angeles magazine office. Claire stands near Molly’s desk while Molly stays seated just outside the tight frame. Keep the office visibly present behind Claire.',
 'EP002-SC001-B-9cddbc93-1':'Molly gives a small warning smile before the line; keep it brief and natural.',
 'EP002-SC001-B-1e626ecf-1':'A shared, silent smile follows Claire’s short question; Claire’s amusement eases as Molly turns back to work talk. No audible laugh or extra words.',
 'EP002-SC002-B-434eba57-1':'In the quiet bar, Claire has been waiting at the small table. Molly has just returned and settles opposite her; the single glass and Molly’s small bag remain still.',
 'EP002-SC002-B-db47f978-1':'After the line, Molly gives a casual smile as if the exchange is routine. Claire lets the topic drop without speaking.',
 'EP002-SC003-B-570bea35-1':'In the theater foyer, Molly sits on the bench beside Claire and holds her injured foot still. The accident stays off screen; her smile does not fully hide the pain.',
 'EP002-SC003-B-310652b4-1':'Claire briefly glances toward the screening room before speaking; keep the foyer in view.',
 'EP002-SC003-B-afcdd16d-1':'Later, Molly stands at the open restroom threshold with her evening bag. A generic silent security woman remains near the sinks in the background; Claire is gone.',
 'EP002-SC003-B-d8178180-1':'Molly notices the security woman. Her practiced smile fades, and she stays at the threshold.',
 'EP002-SC003-B-d2b866d9-1':'The next line is inner voice-over only. Molly’s lips remain still.',
 'EP002-SC003-B-328d7a6d-1':'Use only quiet natural foyer ambience beneath the planned voice-over. No music.'
};
const shots=[];
for(const scene of scenes){
 const cfg=sceneCfg[scene.id];
 for(const line of dialogueByScene.get(scene.id)||[]){
  const speaker=line.speakerId;const char=latest(s.characters,speaker);const wardrobeRef=`REF-WARDROBE-${speaker==='MOLLY'?'MOLLY':'CLAIRE'}-EP002-EVENING`;
  const loc=latest(s.assets,cfg.location);const identity=speaker==='MOLLY'?'CHAR-MOLLY-IDENTITY':'CHAR-CLAIRE-IDENTITY';
  const idRef=speaker==='MOLLY'?'REF-CHAR-MOLLY-IDENTITY-SHEET':'REF-CHAR-CLAIRE-IDENTITY-SHEET';
  const evening=scene.id!=='EP002-SC001';
  const refs=[{referenceId:cfg.locationRef,assetId:cfg.location,role:'location',usage:`Picture 1 is the literal ${cfg.time} ${scene.id==='EP002-SC001'?'magazine office':scene.id==='EP002-SC002'?'quiet bar':'movie theater foyer'} set: preserve its architecture, light, and visible background. It is the scene background, not a mood board.`},
   {referenceId:idRef,assetId:identity,role:'identity',subjectId:speaker,usage:`Identity only for ${char.name}: preserve face, hair, skin tone, age, and build. Ignore the white or studio sheet background and every panel/layout; never reproduce a studio backdrop. Use Picture 1 as the actual scene background.`}];
  if(evening)refs.push({referenceId:wardrobeRef,assetId:`WARDROBE-${speaker}-EP002-EVENING`,role:'wardrobe',subjectId:speaker,usage:`Wardrobe only for ${char.name}: preserve the approved ${speaker==='MOLLY'?'black premiere dress':'navy satin premiere dress'} and simple jewelry. Ignore the gray studio background, pose, and lighting in this wardrobe image; use Picture 1 as the actual set.`});
  const refIds=refs.map(x=>x.referenceId);
  const dialogueCount=line.text.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length||1;
  const durationSeconds=duration(dialogueCount);
  const assigned=beatsForLine.get(line.id).sort((a,b)=>beats.find(x=>x.id===a).source.start-beats.find(x=>x.id===b).source.start);
  const action=assigned.map(bid=>actionText[bid]).filter(Boolean).join(' ');
  const isVO=line.id==='EP002-SC003-B-c8dc1cda-1';
  const shotId=`${scene.id}-D${String((dialogueByScene.get(scene.id)||[]).indexOf(line)+1).padStart(2,'0')}`;
  const spokenDirection=isVO?'Molly stays silent on camera while her inner voice is heard.':'Only '+char.name+' is visible speaking. The other character, if present as a soft shoulder, stays silent with lips closed.';
  const lineAction=`${action?`${action} `:''}${spokenDirection} ${mood[line.text]} Give the listener-directed eyeline to the other person just off camera. Use natural breath, tiny facial changes, and one restrained responsive movement; avoid a frozen pose and avoid theatrical gestures. Speak at a clear conversational pace near 2–2.5 words per second, with careful American English pronunciation. Finish the thought inside this clip without a long pause.`;
  const total=durationSeconds;
  const wordsPerSecond=(dialogueCount/total).toFixed(2);
  const shot={id:shotId,version:1,status:'draft',deps:[{id:script.id,version:script.version}],scriptId:script.id,sceneId:scene.id,episodeId:episode,beatIds:assigned,characterIds:[speaker],referenceIds:refIds,assetIds:[cfg.location,identity,...(evening?[`WARDROBE-${speaker}-EP002-EVENING`]:[])],purpose:`One dialogue turn only, with a natural conversational performance by ${char.name}.`,durationReason:`${dialogueCount} spoken ${dialogueCount===1?'word':'words'} at a target near 2–2.5 words/second; ${total.toFixed(3)} seconds is the shortest supported H3 frame duration that fits this line (${wordsPerSecond} actual words/second), with only a brief motivated facial beat.`,framing:'Vertical 9:16 tight close-up, head and shoulders; speaker’s face large and sharp, with enough active location background to identify the room.',camera:{position:'Eye-level, slightly favoring the speaker’s 3/4 angle toward the off-screen partner.',movement:'Locked camera with only subtle natural handheld breathing; no zoom, pan, or cut.',lens:'Natural portrait perspective, approximately 50 mm equivalent.',focus:'Keep the speaker’s eyes and mouth sharp; preserve visible scene background softly behind them.'},blocking:lineAction,startState:`${char.name} is already settled in the approved scene and looks toward the off-screen conversation partner.`,endState:`${char.name} finishes the single source line and holds a brief, natural listening expression; no new action begins.`,durationSeconds,continuity:{axis:'Keep Molly looking screen-right and Claire screen-left; preserve the established scene axis.',eyelines:'The visible speaker holds responsive eye contact with the partner just off camera; no wandering gaze.',wardrobe:cfg.wardrobe[speaker],props:scene.id==='EP002-SC002'?'Keep the small evening bag and Claire’s single glass consistent; do not pick up or move props.':scene.id==='EP002-SC003'?'Keep the bench, held foot, and evening bag consistent with the specified moment.':'Office clothing and desk remain consistent.',lighting:`Maintain the ${cfg.time} practical lighting of Picture 1; do not inherit reference-board lighting or background.`,},dialogue:[{speakerId:speaker,text:line.text,beatId:line.id}],sound:['Quiet natural scene room tone only; no extra speech or intelligible background voices.'],generationMode:'h3_reference_to_video',routingReason:'H3 reference-to-video is retained for this A/B test because the prior episode used H3. Each generation is now one speaker turn with location-first references, no internal dialogue cuts, and dialogue-only timing.',strategy:'reference-video',finalState:'planned',referencePlan:{references:refs,subjects:[{subjectId:speaker,characterId:speaker,description:`${char.name}, an adult woman in her early thirties. Preserve her exact face, hair, skin tone, and build from the identity sheet. Performance in this turn: ${mood[line.text]}`,wardrobe:cfg.wardrobe[speaker],referenceIds:refIds.filter(x=>x===idRef||x===wardrobeRef)}],shots:[{id:`${shotId}-C01`,beatIds:assigned,inSeconds:0,outSeconds:total,transition:'start',composition:'One tight, natural vertical close-up of the named speaker with the actual office/bar/foyer visibly present behind her. The off-screen partner is not shown speaking.',action:lineAction,camera:'Eye-level steady close-up; speaker’s face and mouth remain unobstructed; slight natural facial and breathing movement only.',continuity:'One speaker turn only. No internal cuts, no changes of speaker, no repeated line, no background from identity or wardrobe sheets.'}],retentionAnalysis:'Preserve the approved source words and assign this one line only to its named speaker. Do not add, repeat, paraphrase, or transfer any words. Preserve identity and use the scene location as the literal background; identity-sheet and wardrobe-sheet backgrounds never appear in the video.',continuityRequirements:['The clip contains exactly one source line and one speaking character; the other person remains silent.','Speak clear American English near 2–2.5 words per second, with careful pronunciation and expressive conversational timing.','Use the location reference as the actual scene background. Never show gray, white, or studio reference-board backgrounds.','Preserve approved face, hair, body, scene wardrobe, props, time, and eyeline direction.','No music, score, soundtrack, stingers, or synthetic accents at any point.'],expectedOutput:`A ${total.toFixed(3)}-second vertical H3 dialogue clip for ${char.name}, with one exact source line and natural responsive acting.`,validationCriteria:['The named character alone delivers the exact line once; no invented, repeated, or reassigned words.','The performance feels connected to a real conversation, with natural eye contact and expressive but restrained facial acting.','The correct office, bar, or foyer is clearly visible behind the close-up; no studio-gray/white background bleed.','The line is clearly spoken at the planned rate and fits inside the clip without dead air.','No music or unplanned audible words.']}};
  if(isVO){shot.dialogue[0].speakerId='MOLLY';shot.framing='Vertical tight close-up on Molly at the restroom threshold; no lip movement during voice-over.';shot.blocking=shot.blocking.replace('Only Molly Reed is visible speaking. The other character, if present as a soft shoulder, stays silent with lips closed.','Molly remains silent on camera while her inner voice is heard.');shot.referencePlan.subjects[0].description='Molly Reed, adult woman in her early thirties, at the restroom threshold. Preserve her approved face, hair, skin tone, and build. Inner voice-over is vulnerable and reflective; her lips stay closed.';shot.referencePlan.shots[0].action='Molly stands at the open restroom threshold with her evening bag. She notices the silent security woman near the sinks; her practiced smile fades. Molly’s face remains silent while her single source line plays as voice-over.';shot.sound=['Quiet natural foyer ambience only beneath one voice-over line; no other speech.'];}
  shots.push(shot);
 }
}
const expected=beats.filter(b=>b.kind==='dialogue').length;
const covered=shots.flatMap(x=>x.beatIds);
if(shots.length!==expected)throw new Error(`expected ${expected} clips, made ${shots.length}`);
if(covered.length!==beats.length||new Set(covered).size!==beats.length||beats.some(b=>!covered.includes(b.id)))throw new Error(`Beat coverage mismatch: ${covered.length}/${beats.length}`);
fs.writeFileSync(`${root}/generation/plans/EP002-dialogue-test-v2.shots.json`,JSON.stringify(shots,null,2));
console.log(JSON.stringify({shots:shots.length,beats:covered.length,duration:shots.reduce((n,x)=>n+x.durationSeconds,0),byScene:scenes.map(x=>({scene:x.id,count:shots.filter(y=>y.sceneId===x.id).length,duration:shots.filter(y=>y.sceneId===x.id).reduce((n,y)=>n+y.durationSeconds,0)})),sample:shots.slice(0,3).map(x=>({id:x.id,duration:x.durationSeconds,line:x.dialogue[0].text,refIds:x.referenceIds,beats:x.beatIds}))},null,2));


