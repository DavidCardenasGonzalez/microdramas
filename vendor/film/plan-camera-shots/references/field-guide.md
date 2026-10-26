# Field Guide

## IDs

- Plan: `shp-001`
- Segment: `seg-001`
- Spatial baseline: `spc-001`

Preserve segment IDs during targeted retries.

## Duration policy

Use one policy per plan:

- `exact`: segment total must equal target duration.
- `bounded`: segment total must remain inside minimum and maximum.
- `editorial`: duration is advisory and must include a reason.

## Studio integration

When used by AI Film Studio, also read `docs/CINEMATIC_DIRECTION.md` from the repository root. Normalize the treatment to `Shot.direction`; every timed shot carries dramatic purpose, observable performance and visible subjects, with a reason for each cut. Assign every dialogue beat to its original visible speaker or independent offscreen/reaction audio. Never treat the automatic locked-camera scaffold as final direction. Preserve facts; interpret acting.

## Blocking preflight issues

- missing beat
- non-positive duration
- unresolved critical asset
- contradictory start and end state
- impossible camera and performer path
- axis or screen-direction contradiction without an intentional transition
