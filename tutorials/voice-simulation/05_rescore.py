"""05 — Rescore
Add new checks to an existing run — no new phone call needed.

Demonstrates:
- Re-evaluating an existing test run with different checks
- Zero new simulation cost — reuses existing conversation data
- Useful for iterating on quality criteria without burning calls
"""
import os
import sys
import httpx
from okareo import Okareo

API_KEY = os.environ["OKAREO_API_KEY"]
BASE_URL = os.environ.get("OKAREO_BASE_URL", "https://api.okareo.com")
HEADERS = {"api-key": API_KEY, "Content-Type": "application/json"}

okareo = Okareo(API_KEY)

# Find the most recent "Multi-Scenario Voice Sim" run (from 04)
SOURCE_RUN_NAME = "Multi-Scenario Voice Sim"

runs_resp = httpx.post(f"{BASE_URL}/v0/find_test_runs", headers=HEADERS, json={})
runs_resp.raise_for_status()
all_runs = runs_resp.json()

source_runs = [r for r in all_runs if r.get("name") == SOURCE_RUN_NAME and r.get("status") == "FINISHED"]
if not source_runs:
    print(f"ERROR: No finished run named '{SOURCE_RUN_NAME}' found. Run 04_scenarios.py first.")
    sys.exit(1)

source_run = sorted(source_runs, key=lambda r: r.get("time_created", ""), reverse=True)[0]
source_id = source_run["id"]
source_checks = list((source_run.get("model_metrics") or {}).get("mean_scores", {}).keys())

print(f"Source run: {source_id}")
print(f"Source checks: {source_checks}")

# Re-evaluate with NEW checks (no phone call, no simulation)
resp = httpx.post(
    f"{BASE_URL}/v0/test_runs/{source_id}/re_evaluate",
    headers=HEADERS,
    json={
        "check_ids": ["response_consistency", "total_turn_count"],
        "name": "Rescore - New Checks",
    },
)
resp.raise_for_status()
new_run = resp.json()

print(f"\nNew run: {new_run['id']}")
print(f"New checks: response_consistency, total_turn_count")
print(f"Same conversations, different analysis — zero phone calls burned.")
print(f"Results: {new_run.get('app_link', 'N/A')}")
