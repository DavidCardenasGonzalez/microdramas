---
name: compile-generation-prompts
description: Compile approved story, asset, and shot artifacts into provider-neutral semantic shot data, storyboard frames, image requests, video requests, provider adapters, and quality gates. Use when a film-production workflow needs traceable generation packages without changing narrative facts.
---

# Compile Generation Prompts

Compile production decisions into executable requests. Do not use prompt writing as an opportunity to redesign the story.

## Inputs

Read the shared request envelope and validate `payload` against `schemas/input.schema.json`.

Require:

- story blueprint
- production assets
- shot plan
- generation targets

Provider capability profiles are optional. Without one, produce provider-neutral
requests and do not claim model compatibility. With profiles, require provider,
model, media type, capability flags, and explicit limits.

## Workflow

1. Audit upstream status, IDs, asset references, duration, and continuity.
2. Build a semantic shot representation that freezes story facts.
3. Define storyboard frames as single observable moments.
4. Compile image requests from identity, environment, composition, action state, lighting, and continuity constraints.
5. Compile video requests from the approved concrete visual treatment, start state, action progression, camera/focus, observable performance change, timed speaker assignments and end state. Missing direction returns to camera; do not fill it with generic cinematic adjectives or repeated negatives.
6. Select a generation mode from text-to-image, text-to-video,
   image-to-video, first/last-frame video, multi-reference video, or audio.
7. Match each request against an explicit provider capability profile.
8. Adapt only supported fields and return structured incompatibility issues
   with practical alternatives.
9. Run quality gates for identity, action count, duration, spatial continuity,
   reference roles, and parameter support.

## Output rules

Return:

- `skill: compile-generation-prompts`
- `data.shot_ir`
- `data.storyboard_frames`
- `data.image_requests`
- `data.video_requests`
- `data.provider_requests`
- `data.quality_gate`

Every request must reference segment, beat, and asset IDs. Keep static frame descriptions separate from temporal video instructions.
Every provider request must state the selected model, generation mode, asset
references, reference roles, compatibility result, and mismatch alternatives.

## Boundaries

- Do not invent dialogue or sound.
- Do not let style language weaken identity constraints.
- Do not place unsupported parameters in provider requests.
- Do not silently drop first-frame, last-frame, multi-reference, character
  reference, duration, or aspect-ratio requirements.
- Do not combine unrelated dominant actions into one short video request.
- Do not call generation services.

Read [references/field-guide.md](references/field-guide.md) for compilation order and quality gates.

## Studio compilation contract (26 October 2026)

Apply docs/CINEMATIC_PIPELINE_CORRECTION.md. Begin every generation prompt with a premium Hollywood feature-film direction using the approved work genre; include the full concrete CinematicStyle and local treatment. Preserve acting, camera/focus, essential visual evidence, literal attributed speech, invariant canonical text and inherited dynamic physical state. Never repeat an initial scene position after it changed, or a spoken line in a state description. Keep analytical titles, IDs, duration rationale and completed-beat ledgers in metadata. Use one full diegetic-only/no-music rule and a brief final reminder. Audit input-usage.json before claiming negative conditioning: a stored negative without an effective binding is metadata. Preserve frozen packages and known remote jobs. Seed A/B comparisons require controlled identical inputs and actual authorized rendering before a visual conclusion.
