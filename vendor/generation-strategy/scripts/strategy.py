"""Local, no-render strategy planner and append-only production journal (stdlib only)."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATES = {'planned': {'preflight', 'blocked'}, 'preflight': {'submitted', 'blocked'},
          'submitted': {'running', 'failed', 'generated'}, 'running': {'failed', 'generated'},
          'generated': {'reviewed'}, 'reviewed': {'reviewed', 'selected', 'rejected'},
          'selected': {'assembled'}, 'assembled': {'exported'},
          'failed': set(), 'blocked': set(), 'rejected': set(), 'exported': set()}

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def write(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')
    temp.replace(path)

def positive(value, name):
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value) or value <= 0:
        raise ValueError(f'{name} must be finite and positive')
    return value

def validate(plan):
    if plan.get('schema_version') != 1 or not isinstance(plan.get('project_id'), str) or not plan['project_id'].strip():
        raise ValueError('schema_version=1 and project_id required')
    if plan.get('plan_approved') is not True:
        raise ValueError('An approved narrative/cinematic plan is required; selection does not approve it')
    if not isinstance(plan.get('shots'), list) or not plan['shots']:
        raise ValueError('Non-empty shots required')
    seen = set()
    for shot in plan['shots']:
        if not isinstance(shot, dict):
            raise ValueError('Each shot must be an object')
        sid = shot.get('id')
        if not isinstance(sid, str) or not sid or sid in seen:
            raise ValueError('Shot IDs must be unique non-empty strings')
        seen.add(sid)
        for key in ('intent', 'framing', 'action', 'camera', 'lighting'):
            if not isinstance(shot.get(key), str) or not shot[key].strip():
                raise ValueError(f'{sid}: {key} required')
        positive(shot.get('duration_seconds'), 'duration_seconds')
        positive(shot.get('fps', 24), 'fps')
        subjects = shot.get('subjects', 1)
        if isinstance(subjects, bool) or not isinstance(subjects, int) or subjects < 0:
            raise ValueError('subjects must be a non-negative integer')
        seed = shot.get('seed', 42)
        if isinstance(seed, bool) or not isinstance(seed, int) or seed < 0:
            raise ValueError('seed must be a non-negative integer')
        for line in shot.get('dialogue', []):
            if not isinstance(line.get('speaker'), str) or not isinstance(line.get('text'), str):
                raise ValueError('Dialogue needs speaker and literal text')
            positive(line.get('rate_wpm', 145), 'rate_wpm')
        for key in ('pauses_seconds', 'exclusive_action_seconds', 'cut_margin_seconds'):
            value = shot.get(key, 0.6 if key == 'cut_margin_seconds' else 0)
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
                raise ValueError(f'{key} must be finite and non-negative')

def inspect(registry):
    result = []
    for mode, item in registry['workflows'].items():
        p = Path(item['workflow'])
        row = {'mode': mode, 'workflow': str(p), 'workflow_exists': p.is_file(), 'runtime_verified': False}
        if p.is_file():
            g = read(p)
            nodes = g.get('nodes', []) + [n for s in g.get('definitions', {}).get('subgraphs', []) for n in s.get('nodes', [])]
            models = sorted({v for n in nodes for v in (n.get('widgets_values') or [])
                             if isinstance(v, str) and v.endswith(('.safetensors', '.gguf', '.ckpt'))})
            row.update(sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
                       classes=sorted({n['type'] for n in nodes if n['type'] not in ('MarkdownNote', 'Note')}),
                       models_referenced=models, evidence='structural_inspection_only')
        result.append(row)
    return result

def choose(shot, registry):
    explicit = shot.get('requested_mode')
    first, last = shot.get('first_frame'), shot.get('last_frame')
    if explicit:
        mode, reason = explicit, 'User explicitly requested this technique'
    elif first and last and shot.get('endpoints_compatible') is True:
        mode, reason = 'flf2v', 'Coherent start/end states constrain the same action'
    elif first:
        mode, reason = 'i2v', 'A composed initial frame anchors the action'
    elif shot.get('identity_required'):
        mode, reason = 'msr', 'Recurring identity requires independent master references'
    else:
        mode, reason = 't2v', 'No mandatory visual starting state or strict recurring identity'
    risks, blockers, needs = [], [], []
    item = registry['workflows'].get(mode)
    if not item:
        return {'id': shot['id'], 'mode': mode, 'status': 'blocked', 'blockers': ['No inspected adapter for requested mode'],
                'rationale': reason, 'alternatives': ['Inspect a compatible adapter or split into supported shots']}
    if not Path(item['workflow']).is_file(): blockers.append('Workflow missing')
    model = shot.get('requested_model')
    if model and model != item['model']: blockers.append('Requested model does not match verified adapter')
    for feature in shot.get('required_capabilities', []):
        if feature not in item['capabilities']: blockers.append(f'Unsupported required capability: {feature}')
    if last and not first: blockers.append('An end frame without a start frame needs an explicit composition plan')
    if mode == 'flf2v':
        if shot.get('endpoints_compatible') is not True: blockers.append('Endpoint compatibility not established')
        if not first: needs.append('first_frame')
        if not last: needs.append('last_frame')
        risks.append('Endpoint guidance does not guarantee exact match; inspect for morphing')
    elif mode == 'i2v' and not first:
        needs.append('first_frame')
    elif mode == 'msr' and not shot.get('identity_references'):
        needs.append('identity_references')
    if mode in ('msr', 't2v') and first: blockers.append('This adapter does not enforce the mandatory first frame')
    if last and mode != 'flf2v':
        if shot.get('last_frame_required', True): blockers.append('Mandatory final frame needs a compatible endpoint strategy')
        else: risks.append('Last image is a reference only, not a constrained endpoint')
    duration = shot['duration_seconds']
    if mode == 'msr' and (duration > 15 or int(duration) != duration):
        blockers.append('Existing MSR runner accepts integer durations from 1 to 15; split the shot')
    speech = sum(60 * len(line['text'].split()) / line.get('rate_wpm', 145) for line in shot.get('dialogue', []))
    total = speech + shot.get('pauses_seconds', 0) + shot.get('exclusive_action_seconds', 0) + shot.get('cut_margin_seconds', 0.6)
    if total > duration: blockers.append('Estimated dialogue/action exceeds duration; redistribute beats')
    if shot.get('head_turn_degrees', 0) >= 90: risks.append('Unseen regions: obtain angle references or split; I2V alone is not reconstruction evidence')
    if shot.get('subjects', 1) > 1: risks.append('Validate each identity, blocking, gaze, occlusion and speaking attribution')
    if shot.get('subjects', 1) >= 4: risks.append('Small faces/crowding: evaluate composition, duration and detail before increasing resolution')
    if shot.get('motion_complexity', 'low') == 'high': risks.append('Complex action: shorten/split if continuity fails')
    if shot.get('continuation_source'): risks.append('Compare continuation frame with masters; do not propagate drift')
    if shot.get('postprocess'): risks.append('Postprocess is a separate inspected adapter; preserve originals and audio sync')
    files = [x for x in [first, last, *shot.get('identity_references', [])] if x]
    missing = [p for p in files if not Path(p).is_file()]
    needs.extend(missing)
    size = shot.get('resolution', registry['profiles']['portrait' if shot.get('orientation') == 'portrait' else 'landscape'])
    if not isinstance(size, dict) or any(isinstance(size.get(k), bool) or not isinstance(size.get(k), int) or size[k] <= 0 for k in ['width', 'height']):
        raise ValueError('Resolution requires positive integer width and height')
    lines = ' '.join(f'{d["speaker"]} says: {json.dumps(d["text"], ensure_ascii=False)}' for d in shot.get('dialogue', []))
    prompt = f'{shot["framing"]}. {shot["intent"]} {shot["action"]} Camera: {shot["camera"]}. Lighting: {shot["lighting"]}. {lines}'
    alt_modes = [m for m in ('i2v', 'msr', 't2v', 'flf2v') if m != mode]
    result = dict(id=shot['id'], mode=mode, model=item['model'], workflow=item['workflow'],
                  workflow_sha256=hashlib.sha256(Path(item['workflow']).read_bytes()).hexdigest() if Path(item['workflow']).is_file() else None,
                  status='blocked' if blockers else 'needs_assets' if needs else 'planned', rationale=reason,
                  neutral_intent=shot, compiled_prompt=prompt.strip(), prompt_compiler='ltx_prose_v1',
                  input_frames={'first': first, 'last': last}, references=shot.get('identity_references', []),
                  seed=shot.get('seed', 42), additional_seeds='Read all sampling stages from exported API',
                  requested_resolution=size, duration_seconds=duration, fps=shot.get('fps', 24),
                  motion_complexity=shot.get('motion_complexity', 'low'), estimated_occupied_seconds=round(total, 3),
                  blockers=blockers, assets_needed=needs, risks=risks,
                  alternatives=[{'mode': m, 'condition': 'Recompose/review assets and verify adapter; never silently override explicit requirements'} for m in alt_modes],
                  validation=['backend nodes/models and VRAM preflight', 'literal dialogue and natural delivery',
                              'temporal identity/anatomy/continuity', 'actual width/height/fps/duration/streams',
                              'full decode plus observed playback when available'],
                  evidence=[item['evidence']], runtime_verified=False)
    return result

def select(plan, registry):
    validate(plan)
    shots = [choose(s, registry) for s in plan['shots']]
    for shot in shots:
        workflow = registry['workflows'].get(shot['mode'], {})
        expected_hash = workflow.get('inspected_sha256')
        if expected_hash and shot.get('workflow_sha256') != expected_hash:
            shot.setdefault('blockers', []).append('Workflow changed since capability inspection: reinspect before use')
            shot['status'] = 'blocked'
        evidence = [e for e in plan.get('prior_results', [])
                    if e.get('scenario') and e.get('scenario') == shot.get('neutral_intent', {}).get('scenario')
                    and e.get('mode') == shot['mode'] and e.get('workflow_sha256') == shot.get('workflow_sha256')
                    and e.get('take_id') and e.get('state') == 'reviewed' and e.get('file') and Path(e['file']).is_file()]
        evidence = list({e['take_id']: e for e in evidence}.values())
        shot['local_evidence'] = evidence
        if len([e for e in evidence if e.get('review_decision') == 'reject']) >= 2:
            shot.setdefault('blockers', []).append('Repeated comparable local failures: revise strategy before another attempt')
            shot['status'] = 'blocked'
    return {'schema_version': 1, 'project_id': plan['project_id'], 'created_at': datetime.now(timezone.utc).isoformat(),
            'state': 'planned', 'shots': shots,
            'notice': 'Planning only. Human/agent review and runtime/API preflight still required; no render was submitted.'}

def record(path, event):
    """Exclusive lock and idempotent IDs prevent concurrent/duplicate journal writes."""
    required = ('event_id', 'shot_id', 'take_id', 'state')
    if any(not isinstance(event.get(k), str) or not event[k] for k in required):
        raise ValueError('event_id, shot_id, take_id and state required')
    if event['state'] not in STATES: raise ValueError('Unknown state')
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    lock = path.with_suffix(path.suffix + '.lock')
    with lock.open('x'):
        pass
    try:
        events = [json.loads(x) for x in path.read_text(encoding='utf-8').splitlines() if x.strip()] if path.exists() else []
        prior_id = next((e for e in events if e['event_id'] == event['event_id']), None)
        if prior_id:
            if any(prior_id.get(k) != v for k, v in event.items()): raise ValueError('Event ID collision')
            return False
        previous = [e for e in events if e['take_id'] == event['take_id']]
        if previous and previous[-1]['shot_id'] != event['shot_id']: raise ValueError('Take belongs to another shot')
        allowed = STATES[previous[-1]['state']] if previous else {'planned'}
        if event['state'] not in allowed: raise ValueError('Invalid state transition; create a new take for retries')
        if event['state'] == 'submitted' and not event.get('prompt_id'): raise ValueError('Submitted requires real prompt_id')
        if event['state'] == 'generated' and (not event.get('file') or not Path(event['file']).is_file()):
            raise ValueError('Generated requires an existing output file')
        if event['state'] == 'reviewed' and event.get('review_decision') not in ('accept', 'reject', 'pending'):
            raise ValueError('Reviewed requires an explicit accept/reject/pending decision')
        if event['state'] == 'selected' and previous[-1].get('review_decision') != 'accept':
            raise ValueError('Select only an accepted take; pending/rejected reviews need resolution')
        entry = {**event, 'recorded_at': datetime.now(timezone.utc).isoformat()}
        with path.open('a', encoding='utf-8') as f: f.write(json.dumps(entry, ensure_ascii=False) + '\n')
        return True
    finally:
        lock.unlink(missing_ok=True)

def character(path, entry):
    if not isinstance(entry.get('id'), str) or not isinstance(entry.get('version'), int) or entry['version'] < 1:
        raise ValueError('Stable character id and positive version required')
    if not entry.get('masters') or any(not Path(p).is_file() for p in entry['masters']):
        raise ValueError('Existing master image files required')
    library = read(path) if Path(path).exists() else {'schema_version': 1, 'characters': []}
    if any((c['id'], c['version']) == (entry['id'], entry['version']) for c in library['characters']):
        raise ValueError('Preserve existing version; use a new version')
    library['characters'].append(entry)
    write(path, library)

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=['inspect', 'select', 'evaluate', 'record', 'character'])
    p.add_argument('--input', type=Path)
    p.add_argument('--output', type=Path)
    p.add_argument('--registry', type=Path, default=ROOT / 'assets/capabilities.json')
    p.add_argument('--history', type=Path, help='Local JSONL journal: verified comparable results inform planning')
    a = p.parse_args()
    registry = read(a.registry)
    if a.command == 'inspect': result = inspect(registry)
    elif a.command == 'select':
        plan = read(a.input)
        if a.history:
            plan['prior_results'] = [json.loads(x) for x in a.history.read_text(encoding='utf-8').splitlines() if x.strip()]
        result = select(plan, registry)
    elif a.command == 'evaluate':
        plan = read(a.input or ROOT / 'assets/evaluation_cases.json')
        result = select(plan, registry)
        for s in result['shots']:
            s['evaluation_variants'] = ['A: natural composition I2V', 'B: extra frontal references only if compatible adapter exists (currently unavailable)',
                                        'C: coherent first/last frames', 'D: split shots and edit']
            s['observed_quality'] = None
        result['evaluation_status'] = 'plans_only_not_rendered'
    elif a.command == 'record': result = {'appended': record(a.output, read(a.input))}
    else:
        character(a.output, read(a.input))
        result = {'registered': True}
    if a.command not in ('record', 'character') and a.output: write(a.output, result)
    print(json.dumps(result if not a.output or a.command in ('record', 'character') else {'saved': str(a.output)}, ensure_ascii=True, indent=2))

if __name__ == '__main__':
    main()
