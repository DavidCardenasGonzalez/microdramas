# Field Guide

## Review decisions

- `selected`: approved as the primary or explicitly named alternate take.
- `rejected`: unsuitable without regeneration; include one or more reason codes.
- `revision-needed`: potentially usable after a defined correction.
- `unreviewed`: no human or authorized automated decision has been made.

Do not infer approval from file existence.

## Timeline

- Preserve media IDs and original source in/out time.
- Keep edits non-destructive.
- Prevent negative duration and source ranges outside known media duration.
- Preserve shot-plan order unless an editorial change includes an explicit reason.
- Represent gaps explicitly instead of silently closing missing coverage.

## Blocking quality checks

- missing required shot
- unreadable or unpersisted media
- critical character identity mismatch
- story action contradicts the approved segment
- impossible source time range
- unresolved content-policy restriction
- export setting incompatible with the project aspect ratio or required delivery format

## Studio final approval

Block final cinematic approval when individual audiovisual evidence or either current timeline continuity/narrative pass is missing or failed. A technically clean face is insufficient if acting lacks intention, information is hidden, actions reset, or generation boundaries disrupt the film. --allow-pending is a preview with pending quality, not a final pass. Refer to docs/CINEMATIC_PIPELINE_CORRECTION.md for exact CLI/schema fields.
