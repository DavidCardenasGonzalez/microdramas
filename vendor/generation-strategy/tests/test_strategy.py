import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('strategy', ROOT / 'scripts/strategy.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class StrategyTests(unittest.TestCase):
    def setUp(self):
        self.registry = m.read(ROOT / 'assets/capabilities.json')
        self.plan = m.read(ROOT / 'assets/evaluation_cases.json')

    def test_ten_acceptance_scenarios(self):
        result = m.select(self.plan, self.registry)
        self.assertEqual(len(result['shots']), 10)
        self.assertEqual([s['mode'] for s in result['shots']],
                         ['msr', 'i2v', 'i2v', 'flf2v', 'i2v', 'i2v', 'i2v', 'i2v', 't2v', 'i2v'])
        self.assertTrue(all(not s['runtime_verified'] for s in result['shots']))
        self.assertTrue(any('Unseen regions' in r for r in result['shots'][2]['risks']))
        self.assertEqual(result['shots'][1]['status'], 'needs_assets')

    def test_explicit_request_never_silently_replaced(self):
        shot = {**self.plan['shots'][0], 'requested_mode': 'Seedance'}
        out = m.choose(shot, self.registry)
        self.assertEqual(out['mode'], 'Seedance')
        self.assertEqual(out['status'], 'blocked')

    def test_no_extra_reference_capability_on_i2v(self):
        shot = {**self.plan['shots'][1], 'required_capabilities': ['i2v_extra_identity_references']}
        self.assertEqual(m.choose(shot, self.registry)['status'], 'blocked')

    def test_incompatible_endpoints_block_flf(self):
        shot = {**self.plan['shots'][3], 'endpoints_compatible': False, 'requested_mode': 'flf2v'}
        self.assertEqual(m.choose(shot, self.registry)['status'], 'blocked')

    def test_abstract_scene_can_use_real_t2v(self):
        shot = {**self.plan['shots'][0], 'identity_required': False, 'dialogue': []}
        self.assertEqual(m.choose(shot, self.registry)['mode'], 't2v')

    def test_msr_limit_not_global_limit(self):
        shot = {**self.plan['shots'][0], 'duration_seconds': 16}
        self.assertEqual(m.choose(shot, self.registry)['status'], 'blocked')
        shot['identity_required'] = False
        self.assertEqual(m.choose(shot, self.registry)['mode'], 't2v')
        self.assertNotEqual(m.choose(shot, self.registry)['status'], 'blocked')

    def test_dialogue_overflow_detected(self):
        shot = {**self.plan['shots'][0], 'dialogue': [{'speaker': 'A', 'text': 'word ' * 60, 'rate_wpm': 120}]}
        self.assertTrue(any('exceeds' in b for b in m.choose(shot, self.registry)['blockers']))

    def test_contract_rejects_bad_numbers_and_duplicates(self):
        for key, value in [('duration_seconds', -1), ('fps', float('nan')), ('seed', True)]:
            plan = copy.deepcopy(self.plan)
            plan['shots'][0][key] = value
            with self.assertRaises(ValueError): m.select(plan, self.registry)
        self.plan['shots'].append(self.plan['shots'][0])
        with self.assertRaises(ValueError): m.validate(self.plan)

    def test_unapproved_plan_is_not_implicitly_approved(self):
        self.plan['plan_approved'] = False
        with self.assertRaises(ValueError): m.select(self.plan, self.registry)

    def test_changed_workflow_needs_reinspection(self):
        self.registry['workflows']['t2v']['inspected_sha256'] = 'outdated'
        self.plan['shots'] = [self.plan['shots'][8]]
        self.assertEqual(m.select(self.plan, self.registry)['shots'][0]['status'], 'blocked')

    def test_real_local_failures_inform_plan_but_stale_does_not(self):
        with tempfile.TemporaryDirectory() as temp:
            take = Path(temp) / 'observed.mp4'
            take.write_bytes(b'test file, not a generated video')
            self.plan['shots'] = [self.plan['shots'][8]]
            selected = m.select(self.plan, self.registry)['shots'][0]
            event = dict(state='reviewed', mode='t2v', scenario='09_upscale', file=str(take), take_id='first',
                         workflow_sha256=selected['workflow_sha256'], review_decision='reject')
            self.plan['prior_results'] = [event, {**event, 'take_id': 'other'}]
            self.assertEqual(m.select(self.plan, self.registry)['shots'][0]['status'], 'blocked')
            self.plan['prior_results'] = [event, event]
            self.assertNotEqual(m.select(self.plan, self.registry)['shots'][0]['status'], 'blocked')
            self.plan['prior_results'] = [{**event, 'workflow_sha256': 'old'}] * 2
            self.assertNotEqual(m.select(self.plan, self.registry)['shots'][0]['status'], 'blocked')

    def test_journal_idempotence_and_transition_validation(self):
        with tempfile.TemporaryDirectory() as temp:
            journal = Path(temp) / 'events.jsonl'
            event = dict(event_id='e1', shot_id='S01', take_id='S01_v1', state='planned')
            self.assertTrue(m.record(journal, event))
            self.assertFalse(m.record(journal, event))
            self.assertEqual(len(journal.read_text(encoding='utf-8').splitlines()), 1)
            with self.assertRaises(ValueError): m.record(journal, {**event, 'event_id': 'e2', 'state': 'exported'})
            self.assertFalse(journal.with_suffix('.jsonl.lock').exists())
            self.assertTrue(m.record(journal, {**event, 'event_id': 'e2', 'state': 'preflight'}))
            with self.assertRaises(ValueError): m.record(journal, {**event, 'event_id': 'e3', 'state': 'submitted'})

    def test_character_master_versions_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            image = Path(temp) / 'master.png'
            image.write_bytes(b'placeholder: path existence test only')
            library = Path(temp) / 'characters.json'
            entry = {'id': 'C01', 'version': 1, 'masters': [str(image)]}
            m.character(library, entry)
            with self.assertRaises(ValueError): m.character(library, entry)
            m.character(library, {**entry, 'version': 2})
            self.assertEqual([c['version'] for c in m.read(library)['characters']], [1, 2])

    def test_pending_review_cannot_be_silently_selected(self):
        with tempfile.TemporaryDirectory() as temp:
            journal = Path(temp) / 'events.jsonl'
            output = Path(temp) / 'take.mp4'
            output.write_bytes(b'test placeholder, not media quality evidence')
            common = {'shot_id': 'S01', 'take_id': 'S01_v1'}
            for index, state in enumerate(['planned', 'preflight', 'submitted', 'generated', 'reviewed']):
                event = {**common, 'event_id': str(index), 'state': state}
                if state == 'submitted': event['prompt_id'] = 'fixture_id'
                if state == 'generated': event['file'] = str(output)
                if state == 'reviewed': event['review_decision'] = 'pending'
                m.record(journal, event)
            with self.assertRaises(ValueError):
                m.record(journal, {**common, 'event_id': 'select', 'state': 'selected'})
            m.record(journal, {**common, 'event_id': 'resolved-review', 'state': 'reviewed', 'review_decision': 'accept'})
            self.assertTrue(m.record(journal, {**common, 'event_id': 'select', 'state': 'selected'}))

if __name__ == '__main__':
    unittest.main()
