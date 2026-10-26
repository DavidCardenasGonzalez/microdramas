import json
from pathlib import Path

p = Path('productions/la-novia-del-vampiro/narrative/drafts')
previous = json.loads((p/'narrative-result-v1.json').read_text(encoding='utf-8'))

# New development revision. Existing snapshots and contract history stay intact.
outline = [
('The Chosen Bride','Village gate','Eleanor tries to shield Clara from the Choosing. Lucian selects Eleanor instead. Elder Vale calls her Eleanor Ashford, revealing that Margaret is her adoptive mother and her birth mother was the previous bride. Eleanor demands a farewell before leaving.','She wins a goodbye but loses certainty about her own past.','Her birth mother never returned alive.','ELEANOR: "Did you take her too?"'),
('The First Refusal','Eleanor’s room','Eleanor demands to go home. Lucian warns her against leaving alone at night and offers to make her immortal. She refuses. He respects that refusal but will not explain the deaths. Maeve brings food; Vivienne presents herself as the woman who knows Lucian best.','Her refusal stands; her questions remain unanswered.','Why offer her eternity before knowing her?','ELEANOR: "You don’t get the rest of my life as well."'),
('Her Mother’s Face','Portrait gallery','Eleanor asks Maeve to show her the previous brides. Maeve identifies Isobel’s portrait and admits that the women were found outside the castle. She believes werewolves killed them; she did not witness the murders. Eleanor resolves to learn what happened to Isobel.','She recovers her mother’s face and chooses a purpose beyond escape.','A blank canvas waits beside the portraits.','ELEANOR: "I’m not asking how he painted her. I’m asking how he lost her."'),
('The Man Who Paints','Studio and bedroom','Lucian expects Eleanor to sit for his customary portrait. She refuses to look serene and makes him paint the anger he can actually see. He accepts the challenge, then dismisses her with a cold answer. Back in her room, she finds a fire burning. Maeve did not light it.','Eleanor asserts herself; an unexplained kindness complicates her judgment.','Her portrait holds a glare rather than resignation.','ELEANOR: "If you’re keeping my face, get it right."'),
('A Single Drop','Rose garden','Eleanor pricks her finger during their first walk. Lucian moves toward the blood. She recoils and tells him to stop. He stops, withdraws, and sends Maeve to tend the cut. His momentary loss of control exposes the danger without turning it into a completed new assault.','She keeps him at a distance and decides to escape.','She has seen the predator beneath the man.','ELEANOR: "Don’t come any closer."'),
('Beyond the Walls','Forest edge','Eleanor leaves to reach her family. A werewolf corners her; Lucian intervenes. Once she is safe, she orders him to put her down. He does so before asking her to return. Having seen the danger for herself, she agrees to go back for this night.','She survives, but her escape route is no longer a simple solution.','Lucian is genuinely afraid of losing her.','ELEANOR: "Saving me doesn’t make me yours."'),
('An Open Door','Eleanor’s room','Eleanor confronts Lucian about hiding the danger. He admits his mistake, offers to escort her outside, and leaves her bedroom door unrestricted. She demands news of her family. He agrees that Maeve will carry a message. Eleanor makes these conditions explicit before discussing immortality again.','She gains contact with home and a boundary he must respect.','Protection can no longer excuse every secret.','LUCIAN: "I thought fear would keep you here." ELEANOR: "It made me run."'),
('Maeve’s Choice','Garden','Eleanor asks whether every woman in the castle was chosen. Maeve explains that she requested transformation to escape her violent father and protect her sisters. Eleanor stops treating her as Lucian’s automatic accomplice, but asks why none of the brides were saved. Maeve admits she cannot answer.','Eleanor gains an ally with a life and judgment of her own.','Maeve offers help without pretending to know the truth.','MAEVE: "I asked him to change me. That doesn’t answer what was done to you."'),
('A Sister in the Woods','Forest threshold','Before Eleanor’s message reaches home, Clara sets out with a kitchen knife to find her. A werewolf corners her. Eleanor hears her scream during an escorted walk and urges Lucian to help. He drives the creature away and allows the sisters to meet.','Clara survives and sees that Eleanor is alive.','They can hold each other, but cannot yet return together.','CLARA: "I wasn’t going to wait for them to bring back your body."'),
('I Choose to Stay','Village boundary','Clara begs Eleanor to come home. Lucian offers to escort them rather than threaten pursuit. Eleanor realizes the elders would hand her over again. She chooses to stay temporarily and find out what happened to Isobel, asking Clara to take news home and stop risking herself.','Returning to the castle becomes Eleanor’s decision.','She proposes ending the cycle of brides.','ELEANOR: "I’m coming back with you. That doesn’t mean I trust you."'),
('The First Bride','Gallery','Eleanor asks about Celeste, the first bride. Lucian admits he loved her and intended to transform her before her murder. He blamed werewolves because of the wounds, not because he witnessed the attack. Asked how it happened repeatedly, he admits that he stopped looking for another explanation.','His suffering stops serving as a sufficient answer.','Eleanor asks to compare his account with Maeve’s.','ELEANOR: "I’m not asking how much it hurt. I’m asking what you know."'),
('An Uneasy Alliance','Studio','Eleanor brings Lucian and Maeve together among the portraits. They acknowledge that they did not witness the deaths and that someone inside could have known when the brides left. Eleanor proposes reconstructing Isobel’s last afternoon. Lucian opens his studio and memories to scrutiny, even if they implicate him.','She gains voluntary cooperation and access.','He entrusts her with Isobel’s portrait without demanding affection in return.','LUCIAN: "If you find something against me, don’t hide it."'),
('Where Daylight Begins','Garden doorway','Lucian stops at the edge of daylight. When a hand briefly crosses the boundary, Eleanor sees the burn and steps back into the shade with him. She does not demand a greater demonstration. He admits that he envies her ability to walk away in sunlight.','Vulnerability becomes mutual through an act of care.','She remains in the shade by choice.','LUCIAN: "There are places I can’t follow you."'),
('The Missing Portrait','Studio','Looking at Isobel’s portrait, Eleanor asks why Lucian never paints himself. When he evades the question, she takes his place at the easel and asks to draw him as she sees him. He lets himself be observed. As they nearly kiss, she asks whether he sees her or another lost bride.','Desire becomes explicit without erasing the unresolved wound.','He must answer without invoking her bloodline.','ELEANOR: "Look again. At me."'),
('The Woman Who Stayed','Gallery','Vivienne mocks Eleanor’s intention to understand Lucian. Eleanor replies that he has started speaking for himself. After she leaves, Vivienne claws the portrait’s frame in anger. The audience sees her violence, but has not yet learned that she killed the brides.','Eleanor recognizes personal hostility; the audience sees an active threat.','Vivienne decides to stop Lucian from opening up.','VIVIENNE: "You’ve only just arrived." ELEANOR: "And he still hasn’t chosen you."'),
('Even If I Say No','Bedroom','Eleanor asks whether Lucian would accept her remaining human. He gives up his nightly question and accepts that she may age or leave. She asks him to come closer and initiates their first kiss. Further intimacy passes into an ellipsis; her voluntary approach is the decisive change.','A mutual kiss without a promise of conversion.','Their relationship can exist without immortality.','ELEANOR: "What if I never want to change?" LUCIAN: "Then I’ll never change you."'),
('The Last Message','Gallery','Maeve remembers Vivienne delivering a supposed summons from Lucian on Isobel’s last day. Lucian denies sending it. The delayed memory does not prove murder, but gives Eleanor a specific contradiction to confront with others present. Maeve acknowledges that she should have spoken sooner.','They gain grounds to investigate Vivienne.','Eleanor shares the suspicion with Lucian rather than hiding it.','ELEANOR: "I don’t know that she’s lying. I know what we have to ask."'),
('The Cost of Asking','Garden and gallery','Lucian summons Vivienne to speak before all three that night. Hearing Isobel’s name, she realizes her story is threatened. Returning from the woods, she has drawn a werewolf along her trail to the garden boundary. Maeve warns Lucian. While they secure the entrance, Vivienne goes after Eleanor.','Their investigation forces the antagonist to act.','Maeve finds the place where Eleanor was waiting empty.','VIVIENNE: "You need witnesses to speak to me now?"'),
('The Other Bride','Sea cliff','Vivienne seizes Eleanor while she is alone and forcibly carries her to the cliff. Eleanor tries to buy time by talking about Lucian. Vivienne admits killing Isobel and the other brides and feeding the conflict with the wolves. Eleanor realizes she must survive to carry the truth back.','She gets her answer but loses her immediate chance to escape.','Vivienne wounds her to imitate another werewolf attack.','ELEANOR: "He didn’t owe you love. None of them owed you their lives."'),
('The Sea She Dreamed Of','Rocks below the cliff','Eleanor clings to Vivienne to keep from falling. Vivienne breaks her grip and pushes her over. After Maeve confirms seeing them leave together, Lucian follows their trail and finds Eleanor alive on the rocks. Eleanor names her attacker before asking for help. He admits he cannot heal her human body.','Her resistance buys enough time for rescue, and her testimony reaches Lucian.','Dying or being transformed are the options that remain.','ELEANOR: "It wasn’t the wolves."'),
('My Answer','Rocks below the cliff','Lucian says transformation can save her, but she will lose daylight and must master the thirst before she can safely visit her family. Eleanor asks him to do it. Her body heals painfully. When she can move again, she touches his face, then asks to return and confront Vivienne.','She lives through an expressed choice and permanently loses her mortal future.','The woman Vivienne believes dead is coming home.','ELEANOR: "I want to live. Change me."'),
('The Bride Returns','Castle entrance','Lucian enters covered in blood and lets Vivienne believe another bride is dead. She blames the wolves. Eleanor appears and contradicts her. Maeve blocks the retreat when Vivienne blurts out that she killed Eleanor. The attempted denial becomes an admission before witnesses.','The account of the latest attack collapses publicly.','Vivienne threatens to kill Eleanor again.','ELEANOR: "This time, you’re going to look at me."'),
('No More Brides','Castle threshold','Vivienne attacks and tries to escape. Maeve and Lucian contain her. Eleanor decides to cast her out toward the wolves that followed her trail. She needs her allies; new strength alone does not surpass centuries of experience. The wolves drag Vivienne away. Afterwards Eleanor shakes, and Lucian stays without celebrating the death.','The threat ends, but Eleanor must live with choosing revenge.','Victory cannot restore Isobel or Eleanor’s mortal life.','ELEANOR: "You don’t get to choose another one."'),
('A Place at the Table','Bedroom and family home','Weeks later, Eleanor fears approaching Clara while the thirst is strong and gives up a premature visit. Years pass as she learns control. She returns with Lucian and embraces a family who recognizes and welcomes her. Her parents’ aged faces reveal what her choice cannot repair. She introduces Lucian and takes her place at the table.','She recovers her family while keeping love, loss, and responsibility.','A closed ending with no new villain.','CLARA: "Your soup’s getting cold."')
]

pilot = '''Title: The Blackwood Bride
Credit: Freely adapted from the novel by Brionna Paige McClendon
Author: Development with Codex / Screenwriting

EXT. VILLAGE GATE - NIGHT

ELEANOR WHITMORE, 23, grips her sister’s hand. CLARA WHITMORE, 26, tries to pull her behind her.

A man dressed in black waits before them: COUNT LUCIAN BLACKWOOD, an adult with red eyes.

AGATHA VALE, an elderly woman, motions Clara aside.

ELEANOR
Not her. Look at me.

LUCIAN
I am.

Eleanor holds his gaze. Lucian offers his hand. She tightens her grip on Clara’s.

AGATHA
Eleanor Ashford.

ELEANOR
That isn’t my name.

Clara looks toward MARGARET WHITMORE, their mother. Margaret lowers her eyes.

ELEANOR
Mother?

MARGARET
You’re my daughter.

AGATHA
Your birth mother was his last bride.

Eleanor releases Clara’s hand. She turns to Lucian.

ELEANOR
Did you take her too?

LUCIAN
Yes.

ELEANOR
Did she come back alive?

Lucian lowers his offered hand.

LUCIAN
No.

Eleanor steps back toward Margaret. Her mother opens her arms. Eleanor stops short of them.

ELEANOR
When were you going to tell me?

MARGARET
I didn’t know how.

CLARA
Don’t go with him.

Agatha reaches for Eleanor’s arm. Lucian steps between them without touching Eleanor.

LUCIAN
Let her say goodbye.

Eleanor looks at the space he has made for her. She embraces Margaret. Clara wraps her arms around them both.

ELEANOR
I’ll find a way back.

Eleanor lets go. Lucian offers his hand again. She walks past it and stops at the gate.

ELEANOR
I want to know what happened to my mother.

Lucian opens the gate. His hand trembles against the wood.

LUCIAN
I know.

Eleanor crosses the threshold. Lucian follows. Clara remains beside Margaret, her hand still outstretched.
'''

character_texts = [
('Eleanor Ashford','Twenty-three; a baker’s daughter raised as Eleanor Whitmore. White hair and blue eyes remain visual proposals. Curious and imaginative, with a loving adoptive family. Her inherited surname is revealed at the Choosing.','Survive, return to her family, and discover who murdered Isobel, her birth mother.','Make belonging and desire her own decisions rather than submit to an inherited fate.','From being handed over to setting conditions, investigating, initiating romance, and choosing survival. Revenge leaves a wound rather than completing a flawless moral ascent.','Direct questions and concrete observations; domestic tenderness with Clara; defiance without speeches with Lucian.'),
('Lucian Blackwood','An adult vampire several centuries old, a count and painter. Guilty of secrecy, controlling protection, and participating in the Choosing, even though he is not the brides’ murderer.','Keep Eleanor alive without exposing himself to another devastating loss.','Give up control, share what he knows, and accept a choice that could leave him alone.','From guarded authority to accountability, shared investigation, and accepting a mortal partner. He helps her survive without claiming ownership of the decision.','Restrained, precise speech that becomes more personal as he admits his mistakes. Uses Eleanor’s name rather than possessive pet names as a default.'),
('Vivienne Voss','An adult vampire and longtime member of the castle household. She treats her longevity and loyalty as an entitlement to Lucian. Her access and historical trust conceal repeated murder.','Eliminate the women Lucian loves and secure his attention for herself.','Accept that no one owes her love; she refuses that insight.','Veiled hostility becomes abduction, confession, attempted murder, exposure, and defeat.','Polite condescension, with an emphasis on who stays and who is temporary; composure breaks when she loses control.'),
('Maeve Hartwell','An adult vampire and ally. One composite character carries the companion, survivor, and witness functions previously spread across three women. She is caring but neither omniscient nor free of omissions.','Prevent another death and make Lucian act beyond his guilt.','Put Eleanor’s safety and agency ahead of habits of discretion.','From private care to sharing her own history, admitting what she withheld, and physically opposing Vivienne.','Warm, practical, and willing to say she does not know. Her experience is personal testimony rather than universal proof.'),
('Clara Whitmore','Twenty-six; Eleanor’s adoptive sister, a cook, affectionate and protective. She knew of the adoption but did not understand the full consequence of the Choosing.','Bring her sister home alive.','Listen to Eleanor’s decisions rather than confuse protection with deciding for her.','Risks herself in a rescue attempt, accepts carrying news instead, and eventually welcomes a changed sister home.','Familiar and dry; affection comes through food, shared tasks, and blunt concern.'),
('Margaret Whitmore','Eleanor’s loving adoptive mother. Appears at the beginning and end. Her husband Thomas remains a background family member without a speaking role.','Keep her daughter alive and preserve their bond.','Acknowledge the hurt caused by concealing Eleanor’s origins.','From fear-driven secrecy to welcoming her without demanding she become her former self.','Brief and intimate; she does not pretend the sacrifice is fair.'),
('Agatha Vale','An adult elder and the village elders’ spokesperson. A functional role embodying collective fear, without an added mastermind subplot.','Complete the handover to prevent the retaliation she believes refusal could provoke.','Face the human cost of sacrificing one woman for collective safety.','Represents social pressure; the resolution does not depend on exposing her as another secret killer.','Ritual formulas and impersonal assertions that avoid taking responsibility.')
]
characters=[]
for old, new in zip(previous['characters'],character_texts):
    name,description,want,need,arc,voice=new
    characters.append(dict(id=old['id'],name=name,description=description,want=want,need=need,arc=arc,voice=voice))

decisions = [
'User direction, October 23, 2026 (Mexico City): simple production mode for this project; all final creative deliverables in English, while conversation with the user remains in Spanish.',
'The male lead is Count Lucian Blackwood. Every retained, composite, or backstory character receives a new name. These names supersede the preceding Spanish development revision.',
'Working English title: The Blackwood Bride. This is an editorial working title, not an additional locked user requirement.',
'Proposed closed season: 24 episodes at 90–120 seconds, approximately 36–48 minutes total, vertical format. Episode count and timing remain editorial proposals; only the pilot is a completed screenplay. The CLI initialization profile still contains its default 15-episode planning count.',
'Current cast: Eleanor Ashford, raised as Eleanor Whitmore; Lucian Blackwood; Vivienne Voss; Maeve Hartwell; Clara Whitmore; Margaret Whitmore; Agatha Vale. Backstory names: Isobel Ashford (birth mother), Celeste Ashford (first bride), Thomas Whitmore (adoptive father, no speaking role).',
'Eleanor is 23 and Clara 26; all romantic participants are adults. Retain a fictional preindustrial Gothic setting. Lucian and Eleanor have no biological relationship. The bride lineage is human, not his descendants; no reincarnation or predestined souls.',
'Simple production changes the workflow, not the story. Keep the established romance, central mystery, causal sequence, and transformation costs. This revision changes language and naming, not the plot.',
'Eleanor requires communication, an unrestricted bedroom door, and accountability. Rescue alone does not absolve Lucian or establish romance.',
'Maeve is the single composite companion; she also carries the minimal witness function. Clara and the adoptive parents remain loving, not antagonistic. Thomas has no speaking role.',
'Werewolf responsibility is a belief, not established fact. Vivienne’s confession, Eleanor’s testimony, and the public admission of the latest attack are different evidence layers.',
'Retain declared additions: explicit conditions, the delayed family message, joint investigation, the remembered summons, the wolves’ trail, and the reversed portrait sitting. Source mapping is retained in the English proposal.',
'Transformation is explicitly requested under threat of imminent death. Retain pain, lost daylight, blood thirst, years of separation, revenge, and the family’s aging. Love does not remove those costs.',
'No new prophecy, telepathy, solar cure, or convenient blood power. A newly transformed Eleanor needs help to contain an experienced vampire.',
'Sensuality through proximity, touch, and an initiated kiss; further intimacy in ellipsis. Reduce descriptive gore without deleting bodily consequence.',
'All future video: no background music, score, or soundtrack, including stingers, drones, musical introductions or endings, and music from devices. Only explicitly planned dialogue and diegetic sound. No media generation authorized by this language revision.',
'Revision v2 supersedes v1 for current development. Preserve v1 and all CLI version history. The result remains a reviewed development draft; the remaining 23 episode scripts and audiovisual review are pending.',
'Read source passages were previously recorded; this revision does not claim a new complete reading or full line-by-line fidelity audit. Inspect any additional source scene when scripting it.',
'Stable internal character IDs are retained for lineage. Embedded legacy tokens in technical IDs are not current character names and must never appear as screen credits or dialogue labels.'
]

result=dict(
authority='screenwriting',
skillsUsed=previous['skillsUsed'],
brief='Free adaptation of The Vampire’s Bride by Brionna Paige McClendon. Current working title: The Blackwood Bride. User communication remains in Spanish; all final creative material is in English. Use simple production for this project. Male lead: Lucian Blackwood; all other characters renamed. Preserve the existing story while revising its language and names. Delivery: a 24-episode proposed structure, character bible, adaptation map, and English pilot; not 24 finished scripts.',
bible=dict(id=previous['bible']['id'],premise='Given as a bride to the vampire she believes murdered her mother, Eleanor Ashford investigates the deaths of the women before her. Surviving means confronting Lucian Blackwood’s secrets and defending her freedom to choose even as she falls in love with him.',theme='Love becomes possible when care stops demanding obedience; choosing for oneself does not erase loss or responsibility.',conflict='Eleanor needs truth and autonomy. Lucian mistakes silence for protection. Vivienne kills the women he loves, while the village maintains its sacrifice out of fear. Pursuing the truth increases the danger and brings the couple closer.',ending='Eleanor requests transformation to survive Vivienne’s attack, participates in her punishment, and lives with the consequences. Years later, after mastering the thirst, she returns with Lucian to her aging but loving human family.',seasonOutline=[f'EP{i:03d} — {e[0]}. {e[2]} Local result: {e[3]} Exit: {e[4]}' for i,e in enumerate(outline,1)],decisions=decisions),
characters=characters,assets=[],episodes=[dict(id='EP001',title=outline[0][0],synopsis=outline[0][2],scriptText=pilot)],
review=dict(reviewer='Codex / Screenwriting; Drama criteria consulted as recommendations only',findings=[
'Revision checked against the preceding development for story preservation. Language and naming changed; the 24-episode causal structure remains.',
'Pilot and proposed episode titles, descriptions, sample dialogue, character profiles, and current creative decisions are in English. The Spanish conversation preference is recorded.',
'Names updated for all speaking roles and named backstory characters. Eleanor’s two surnames reflect adoption and revelation; Clara and Margaret remain Whitmore.',
'Pilot entry: sisters holding hands before a man with red eyes. Inciting action, adoption revelation, goodbye won, and an expressed objective all occur before the cut.',
'Lucian admits that the birth mother did not return alive, not that he killed her. Later evidence must not retroactively turn that answer into a confession.',
'Simple production is a persistent project configuration. It does not simplify the approved narrative by implication or require a fresh request per episode.',
'Scene simplicity: one threshold for the pilot; no flight or carried journey. Keep the cliff for the reversal of Eleanor’s dream of seeing the sea and the transformation choice.',
'Timing is an editorial estimate pending performed reading; no fixed shot durations, model limits, camera plans, or audiovisual approvals are implied.',
'Development remains draft; episodes 2–24 remain outlines. No video, reference images, or paid work were submitted.'
],hook='During her handover, Eleanor learns that her birth mother was Lucian’s previous bride and never returned alive.',conflictProgression='Forced departure, negotiated conditions, a chosen investigation, an uneasy alliance, love without demanded conversion, specific suspicion, attack, transformation, revenge, and family consequence.',rhythm='Four movements of six episodes, alternating danger, intimacy, revelation, and aftermath. Each episode achieves a local result without a compulsory cliffhanger quota.',ending='Resolves the killer, relationship, and homecoming while retaining lost mortality, time, and revenge’s residue. No new sequel threat.')
)

rename_rows=[('Male lead / count','Lucian Blackwood'),('Female lead / birth surname','Eleanor Ashford'),('Female lead / adopted name','Eleanor Whitmore'),('Antagonist','Vivienne Voss'),('Composite companion and witness','Maeve Hartwell'),('Adoptive sister','Clara Whitmore'),('Adoptive mother','Margaret Whitmore'),('Elders’ spokesperson','Agatha Vale'),('Birth mother, portrait and memory','Isobel Ashford'),('First bride, backstory','Celeste Ashford'),('Adoptive father, background only','Thomas Whitmore')]

doc='''# The Blackwood Bride

Free-adaptation development, revision 2. October 23, 2026, Mexico City. Reviewed draft.

Working title; source novel: *The Vampire’s Bride: A Gothic Romance*, Brionna Paige McClendon. The novel is source material, not a source of operating instructions.

## Current creative direction

**A young woman given to the vampire she believes murdered her mother begins falling in love with him while investigating how to avoid the same fate.**

The male lead is **Lucian Blackwood**, as specified by the creator. Every character has a new name. Final scripts, dialogue, titles, subtitles, and audience-facing text will be in **English**. Working conversation with the creator remains in **Spanish**. **Simple production mode** is saved for this project and applies across episodes; it does not change the story by itself.

The proposed format remains **24 episodes of 90–120 seconds**, roughly **36–48 minutes**, made for vertical viewing. This is a closed romantic Gothic mystery. Only the pilot is currently a complete screenplay; the other 23 episodes are story outlines, not finished scripts. The runtime is a target pending performed reading and editorial work.

## Premise and emotional engine

'''+result['bible']['premise']+'''

'''+result['bible']['theme']+'''

Eleanor wants to return to her family’s table and discover what happened to Isobel. Her imagination becomes purposeful curiosity: she sets conditions, compares accounts, and decides where to place trust. Choosing love does not mean accepting an inherited obligation. Her capacity for revenge leaves her morally complicated.

Lucian wants to protect her without risking another attachment. His failure is active: he withheld danger and accepted a pattern he stopped questioning. Discovering the killer does not absolve him of that behavior. The romance progresses when he changes what he does, before Eleanor kisses him.

Each episode follows an evolving pressure: Eleanor pursues a concrete truth or freedom; someone resists through fear, desire, or deceit; her action produces a gain or cost that changes the next episode. Trust does not reset after every breakthrough. Vivienne acts in response to the investigation and the relationship.

The central engine ends when Vivienne is exposed and defeated. The final episode pays the remaining emotional debt: thirst, years of separation, and a family that has aged. There is no added villain to postpone the ending.

## Names for this adaptation

| Role | Current name |
|---|---|
'''
for role,name in rename_rows:
    doc+=f'| {role} | {name} |\n'
doc+='''
Eleanor is introduced as **Eleanor Whitmore**. The Choosing reveals **Ashford**, her birth surname. This is one woman with a changed understanding of her identity, not two characters. Lucian has no biological relationship to her or to the human bride lineage. No reincarnation or predestined soul is introduced.

## Season movements

| Episodes | Movement | Lasting change |
|---|---|---|
| 1–6 | Bride of the suspected murderer | Eleanor loses her former life; escape reveals the external danger. |
| 7–12 | Learning to choose | Conditions, contact with her sister, a decision to investigate, and an alliance. |
| 13–18 | Love raises the stakes | Lucian accepts a mortal partner; a concrete contradiction threatens Vivienne. |
| 19–24 | Survival has a price | Confession, attack, conversion, punishment, and a homecoming marked by lost time. |

The midpoint is cooperation, not the solution. A substantial romantic payoff arrives before the climax. The ending has room for tenderness and loss rather than another threat.

## Character bible

'''
for c in characters:
    doc+=f"### {c['name']}\n\n{c['description']}\n\n**Want:** {c['want']}\n\n**Need:** {c['need']}\n\n**Arc:** {c['arc']}\n\n**Voice:** {c['voice']}\n\n"
doc+='''## Episode outline

Each episode resolves a local action or changes a relationship before its outgoing question. Dialogue below is original English sample dialogue, not a literal quotation from the source novel.

'''
for i,e in enumerate(outline,1):
    doc+=f'### {i:02d}. {e[0]}\n\n**Setting:** {e[1]}.\n\n{e[2]}\n\n**Local result:** {e[3]}\n\n**Exit:** {e[4]}\n\n**Sample dialogue:** {e[5]}\n\n'
doc+='''## Continuity and information

- EP001: Eleanor and the audience discover the adoption. Lucian’s answer establishes the mother’s death, not his authorship of it.
- EP003–EP011: the werewolf explanation is a shared belief, never omniscient fact.
- EP007–EP010: communication is negotiated. Clara leaves before the message arrives. Eleanor’s return is an expressed choice under social pressure, not a new claim of ownership by Lucian.
- EP012: access and cooperation, once earned, remain available. Do not arbitrarily restore secrecy to manufacture another episode.
- EP015: viewers see Vivienne’s hostility and violence before they know the full murder history.
- EP016: Lucian accepts Eleanor remaining human. Later conversion does not invalidate her earlier refusal.
- EP017–EP018: the remembered summons justifies questions, not a verdict. Eleanor shares the suspicion.
- EP019–EP022: distinguish Vivienne’s private confession, Eleanor’s eyewitness account, and the public admission of the latest attack.
- EP021: transformation requires an explicit request. The life-or-death emergency limits the choice; it does not make the costs disappear.
- EP023: allies help contain Vivienne. Wolves follow a trail already established; they do not appear because they magically understand a verdict.
- EP024: control of the thirst takes years. Love provides company, not an instant cure. The family’s aging carries the cost into the final scene.

Eleanor and Lucian’s voices become more intimate through shorter defenses, direct names, and more specific admissions. English does not reproduce the Spanish formal/informal pronoun distinction; that progression must be performed through diction and behavior. Clara remains domestic and candid; Maeve can admit uncertainty; Vivienne treats permanence as entitlement. Avoid making every character speak in trailer slogans.

## Adaptation map

Page ranges refer to PDF pages, counting the first page as 1. They preserve the previously inspected source anchors; this language revision does not claim a fresh complete reading. All adaptation character references below use the current names. Additional source scenes must be read in full when scripted.

| Operation | Source pages | Episodes | Adaptation decision |
|---|---|---|---|
| Keep and condense | 5–6, 21–33 | 1 | Choosing, hidden lineage, adoption, and farewell; enter through the sisters’ separation. |
| Keep and rewrite | 61–63, 87–89 | 2, 7, 16, 21 | Immortality offers change meaning at distinct turning points rather than repeat mechanically. |
| Keep | 78–83, 214–215 | 3–4, 14 | Portraits and the fire as memory and care, not supernatural proof. |
| Reorder | 139–140, 157–158 | 5–6 | Blood incident motivates flight. Inspect the complete chapter-five incident before final scripting. |
| Merge | 154–162, 164–166, 263–264 | 7–8, 17–18, 22–23 | Maeve carries companionship, survivor history, and practical intervention, without turning supportive women into accomplices. |
| Keep and condense | 225–239 | 9–12 | Sister’s rescue, opportunity to return, and first-bride history. The two rescues have different consequences and need not repeat a long chase. |
| Keep and reformulate | 292–293, 378–380 | 12–16 | Openness and acceptance of mortality become visible conduct before the first kiss. |
| Keep; change the approach | 391–406 | 19–21 | Confession, attack, and conversion. Vivienne explicitly abducts Eleanor rather than requiring an already suspicious heroine to follow willingly. |
| Transfer witness function | 391, 405 | 18–20 | Maeve sees the women leave; Lucian has a concrete way to find Eleanor. |
| Keep with physical support | 408–414 | 22–23 | Eleanor’s return and dark punishment remain, but allies help contain the experienced antagonist. |
| Keep | 415–416, 430–437 | 24 | Thirst, years of separation, aged family, and reunion. |
| Add | Checked against 154–155, 228–229 | 7, 9 | Explicit conditions and a message not yet delivered make repair and communication visible. |
| Add | Checked against 231–236, 395 | 11–12, 17–18 | Shared investigation and the old summons provide intermediate discoveries. The old summons is an invented adaptation link, not a confirmed source fact. |
| Add | Checked against 78–81, 381 | 13–14 | Daylight doorway and reversed portrait sitting express vulnerability without inventing a cure or power. |
| Add | Checked against 395–396, 406–407 | 18, 23 | Establish the wolves’ trail before the punishment; no added pack leader or magical treaty. |
| Condense family roles | 29–31, 436–437 | 1, 24 | Thomas has no speaking role. Margaret and Clara preserve the family’s loving stance. |
| Rename and rewrite | All anchors above | All | Entire adaptation cast renamed; English dialogue and prose replace revision 1. Source title and author remain correctly attributed. |

## Review and production notes

This revision follows the creator’s language and naming direction while preserving the preceding story. It does not claim that the season is fully scripted. The remaining development risks are the credibility of the long-undetected murders and the transition from imposed bride to chosen partner. Keep Lucian’s accountability, Eleanor’s expressed conditions, and the limits of each clue visible.

Simple production prioritizes the next bounded scene and reuses valid work. It does not remove required skills, real references, model limits, scoped authorizations, or review. The cliff remains because it reverses Eleanor’s desire to see the sea and forces the survival choice. Reusable interiors are the room, gallery/studio, and garden threshold.

Future scenes, prompts, subtitles, and audience-facing materials must be in English. All video must have **no background music, score, or soundtrack** at any point; use only explicitly planned dialogue and diegetic sound. No images, audio, or video were generated during this revision.

The pilot is supplied in Fountain. Duration requires a performed reading; no rehearsal, audiovisual review, camera plan, or provider limit is asserted. Internal contract IDs remain stable for lineage, and earlier drafts remain archived as history rather than current creative direction.

Next step: script episodes 2–6 in English under the revised names, checking their original source passages before finalizing action and dialogue. Continue the creator conversation in Spanish.
'''

(p/'narrative-result-v2-en.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
(p/'EP001-v2-en.fountain').write_text(pilot,encoding='utf-8')
(p/'the-blackwood-bride-development-v2-en.md').write_text(doc,encoding='utf-8')
print(json.dumps({'outlineEpisodes':len(outline),'characters':[c['name'] for c in characters],'pilotWords':len(pilot.split()),'result':str(p/'narrative-result-v2-en.json')},ensure_ascii=False))
