"""Reuse the user's inspected graph builder, without running its submit/resume loop."""
import importlib.util
import json
import sys
from pathlib import Path

request = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8-sig"))
spec = importlib.util.spec_from_file_location("studio_existing_msr", request["runner"])
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
runner.COMFY_ROOT = Path(request["comfyRoot"])
base = runner.load_json(Path(request["base"]))
# Add optional reference loaders only in this production copy, using verified guide slots.
for slot in request["shot"]["references_by_slot"]:
    if slot not in base[runner.DEFAULT_NODE_IDS["guide"]]["inputs"]:
        node_id = "studio_" + slot
        base[node_id] = {"class_type": "LoadImage", "inputs": {"image": ""}}
        base[runner.DEFAULT_NODE_IDS["guide"]]["inputs"][slot] = [node_id, 0]
graph = runner.build_graph(base, request["shot"], request["width"], request["height"],
                           request["slug"], Path(request["referenceDir"]), runner.DEFAULT_NODE_IDS)
Path(request["output"]).write_text(json.dumps(graph, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"graph": request["output"], "builder": request["runner"]}))
