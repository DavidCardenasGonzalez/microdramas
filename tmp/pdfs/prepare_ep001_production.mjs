import fs from 'node:fs';
const root='productions/la-novia-del-vampiro';
const folder=root+'/narrative/drafts/';
const r=JSON.parse(fs.readFileSync(folder+'narrative-result-v5-character-sheets-en.json','utf8'));
const previous=r.episodes[0].scriptText;
const labels={ELEANOR:'ELEANOR ASHFORD',LUCIAN:'LUCIAN BLACKWOOD',CLARA:'CLARA WHITMORE',MARGARET:'MARGARET WHITMORE',AGATHA:'AGATHA VALE'};
const screenplay=previous.slice(previous.indexOf('EXT. VILLAGE GATE - NIGHT')).replace(/^(ELEANOR|LUCIAN|CLARA|MARGARET|AGATHA)$/gm,x=>labels[x]);
const before=[...previous.matchAll(/^(ELEANOR|LUCIAN|CLARA|MARGARET|AGATHA)\n([^\n]+)/gm)].map(x=>x[2]);
const after=[...screenplay.matchAll(/^(?:ELEANOR ASHFORD|LUCIAN BLACKWOOD|CLARA WHITMORE|MARGARET WHITMORE|AGATHA VALE)\n([^\n]+)/gm)].map(x=>x[1]);
if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Dialogue changed');
r.episodes[0].scriptText=screenplay;
for(const ch of r.characters)ch.description+=' Production identity record retained for the current English scene breakdown; full canonical names are used as screenplay speaker cues.';
const charAssets=[
['AST-ELEANOR','CHAR-YELENA','Eleanor Ashford','Creator-directed identity sheet: references/characters/eleanor-ashford-triptych-v1.png. Long loose silver-white hair, pale blue eyes, fair skin and adult proportions. Evidence: EP001 introduces Eleanor and creator supplied portrait reference. Clothes are separately bound for this scene.',['Eleanor','Eleanor Ashford','Eleanor Whitmore']],
['AST-LUCIAN','CHAR-DRAVMIR','Lucian Blackwood','Creator-selected reference: references/characters/lucian-blackwood-identity-v1.png. Short tousled black hair, amber eyes, pale skin, defined jaw and branching neck tattoo. Preserve canonical spelling Lucian. Evidence: creator-selected PNG and EP001 explicit amber eyes and black clothing. Do not copy modern watch or jewelry into the period scene.',['Lucian','Lucian Blackwood']],
['AST-CLARA','CHAR-DANNA','Clara Whitmore','Adult 26-year-old adoptive sister. Face and hair are not yet visually fixed. Must be distinct from Eleanor; no biological resemblance requirement. Evidence: EP001 explicitly introduces her and depicts protective handholding and family embrace. Identity sheet missing.',['Clara','Clara Whitmore']],
['AST-MARGARET','CHAR-MADRE','Margaret Whitmore','Adult adoptive mother; face and hair not yet visually fixed. Evidence: EP001 names Margaret and depicts lowered eyes, opened arms and family embrace. Identity sheet missing.',['Margaret','Margaret Whitmore']],
['AST-AGATHA','CHAR-ANCIANA','Agatha Vale','Elderly woman and village representative; face and hair not yet visually fixed. Evidence: EP001 introduction, gesture toward Clara and attempted reach for Eleanor. Identity sheet missing.',['Agatha','Agatha Vale']]
];
r.assets=charAssets.map(([id,ownerId,name,description,aliases])=>({id,ownerId,kind:'character',name,description,aliases}));
r.assets.push({id:'AST-VILLAGE-GATE',kind:'location',name:'Village Gate at Night',description:'EP001-SC001 only. Evidence: explicit EXT. VILLAGE GATE - NIGHT heading. Production proposal: weathered timber gate in a rough stone surround, village side foreground, dark road outside. Gate opens outward toward the road; single leaf is operable without crossing the actors. Low warm village practical light and soft cool night fill. Architecture is a proposal; no narrative inscriptions or invented symbols. Composed reference is missing.',aliases:['VILLAGE GATE']});
const wardrobe=[
['WARD-ELEANOR-EP001','CHAR-YELENA','Eleanor village dress','Blue-gray linen/wool long-sleeved modest dress, full ankle-length skirt, plain dark leather shoes; use the creator-requested sheet as this scene’s wardrobe. Long loose white hair.'],
['WARD-LUCIAN-EP001','CHAR-DRAVMIR','Lucian period black outfit','Plain black high-quality linen shirt and dark period-appropriate trousers, long black wool coat, dark leather boots. Neck tattoo visible at collar. No wristwatch or contemporary accessories. Derived from explicit black clothing and selected identity reference; tailoring is a contextual visual proposal.'],
['WARD-CLARA-EP001','CHAR-DANNA','Clara village dress','Proposed plain muted warm-brown long-sleeved village dress, simple waist tie and dark leather shoes. No loose apron during the handover. Not a globally fixed costume.'],
['WARD-MARGARET-EP001','CHAR-MADRE','Margaret village clothing','Proposed worn plum-brown modest dress and simple neutral shawl, dark shoes. Arms remain free enough for the embrace. Not a globally fixed costume.'],
['WARD-AGATHA-EP001','CHAR-ANCIANA','Agatha village clothing','Proposed charcoal modest long dress and dull gray shawl, practical dark shoes. No staff or ceremonial object, because the screenplay does not establish one.']
];
for(const [id,ownerId,name,description] of wardrobe)r.assets.push({id,ownerId,kind:'wardrobe',name,description:'Scene variant for EP001-SC001 only. '+description+' Preserve from the first through the final shot. Evidence: EP001 named participant and creator-authorized contextual wardrobe direction.',aliases:[]});
r.bible.decisions.push('EP001 production planning: screenplay format-only revision removes cover metadata from the parseable body and expands speaker cues to canonical full names. Every action and spoken word is preserved; title and credits remain in the development document. Previous approved snapshot retained.');
r.bible.decisions.push('EP001 uses Eleanor, Lucian, Clara, Margaret and Agatha at one village gate. Maeve is absent. Scene-specific wardrobe and five character assets plus gate location are registered; three supporting faces and gate visual are still missing. Existing character boards are identity/wardrobe guides, never literal start frames.');
r.review.findings.push('Format-only comparison verified identical spoken words in original order. Upstream ambiguity is resolved through a new Screenwriting revision, not by inventing dialogue in production.');
fs.writeFileSync(folder+'EP001-v4-en.fountain',screenplay);
fs.writeFileSync(folder+'narrative-result-v6-ep001-production-en.json',JSON.stringify(r,null,2)+'\n');
console.log(JSON.stringify({spokenLines:after.length,scriptChangedOnlyFormat:true,assets:r.assets.length}));
