---
name: plan-camera-shots
description: Convert structured beats into executable shot segments with duration, framing, camera movement, blocking, sound, spatial baselines, asset bindings, and continuity checks. Use when a film project needs a shot plan, targeted retries, preflight review, or generation-ready camera context.
---

# Plan Camera Shots

Design shots that express the approved story while remaining spatially and temporally executable.

## Inputs

Read the shared request envelope and validate `payload` against `schemas/input.schema.json`.

Require project ID and beats. Accept story blueprint, production assets, camera constraints, an existing plan, and retry segment IDs as optional context.

## Workflow

1. Normalize beat order, duration constraints, and available assets.
2. Establish a spatial baseline for each location.
3. Define continuity constraints for axis, eyeline, screen direction, lighting, wardrobe, and prop state.
4. Interpret character objective, obstacle, subtext and emotional progression. Choose coverage for dramatic attention, performance, geography and causal action; use neither the fewest segments as an optimization target nor a fixed cut count. A continuous take is valid when its dramatic value is explained.
5. Translate genre and audience experience into concrete light, framing, camera, focus and edit rhythm. Specify camera position, movement, blocking, observable performance, sound, and duration. For every segment, include a concise `duration_reason` tied to visible action, spoken words, a motivated pause, and the intended edit rhythm.
6. Record start state, action path, and end state for each segment.
7. Bind asset IDs and upstream beat IDs.
8. Run preflight checks and preserve unaffected segments during targeted retries.

## Output rules

Return:

- `skill: plan-camera-shots`
- `data.spatial_baselines`
- `data.continuity_rules`
- `data.segments`
- `data.preflight`

The sum of segment durations must follow the selected duration policy. Choose the shortest duration that lets the planned action and dialogue read at the intended rhythm; do not pad toward a maximum or inherit long durations from another generation mode such as MSR. Recalculate duration for each shot and generation from its own content and verified model limits. Each segment needs one dominant action chain. Continuity overrides creative novelty when the two conflict.

## Boundaries

- Do not change story events or dialogue.
- Do not generate images or video.
- Do not use camera terms that contradict blocking or duration.
- Do not reference assets that are absent without a diagnostic.

Read [references/field-guide.md](references/field-guide.md) for IDs, duration policy, and preflight gates.
