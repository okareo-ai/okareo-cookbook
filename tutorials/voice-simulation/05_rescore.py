"""05 — Rescore
Add new checks to an existing run — no new phone call needed.

Demonstrates:
- Re-evaluating an existing test run with different checks
- Zero new simulation cost — reuses existing conversation data
- Useful for iterating on quality criteria without burning calls
"""
import os
import sys
from okareo import Okareo

okareo = Okareo(os.environ["OKAREO_API_KEY"])

# Find the most recent "Multi-Scenario Voice Sim" run (from 04)
SOURCE_RUN_NAME = "Multi-Scenario Voice Sim"

all_runs = okareo.find_test_runs(name=SOURCE_RUN_NAME)
source_runs = [r for r in all_runs if r.get("status") == "FINISHED"]

if not source_runs:
    print(f"ERROR: No finished run named '{SOURCE_RUN_NAME}' found. Run 04_scenarios.py first.")
    sys.exit(1)

source_run = sorted(source_runs, key=lambda r: r.get("time_created", ""), reverse=True)[0]
source_id = source_run["id"]
source_checks = list((source_run.get("model_metrics") or {}).get("mean_scores", {}).keys())

print(f"Source run: {source_id}")
print(f"Source checks: {source_checks}")

# Re-evaluate with NEW checks (no phone call, no simulation)
new_run = okareo.re_evaluate(
    test_run_id=source_id,
    checks=["response_consistency", "total_turn_count"],
    name="Rescore - New Checks",
)

print(f"\nNew run: {new_run.id}")
print(f"New checks: response_consistency, total_turn_count")
print(f"Same conversations, different analysis — zero phone calls burned.")
print(f"Results: {new_run.app_link}")
