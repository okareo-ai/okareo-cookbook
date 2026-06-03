"""07 — CI Gate
Threshold-based pass/fail for CI pipelines. Exits non-zero when quality drops.

Demonstrates:
- Running multiple conversations (repeats * scenarios) for statistical significance
- Threshold-based pass/fail on check scores
- sys.exit(1) for CI integration (GitHub Actions, Jenkins, etc.)
"""
import os
import sys
from okareo import Okareo
from okareo.model_under_test import Target, TwilioVoiceTarget
from okareo_api_client.models import ScenarioSetCreate
from shared import DEFAULT_DRIVER, TARGET_PHONE

okareo = Okareo(os.environ["OKAREO_API_KEY"])

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - CI Gate",
    seed_data=okareo.seed_data_from_list([
        {"input": "Reset your account password. Confirm you received the reset email.",
         "result": "Agent walks through password reset process"},
        {"input": "Find out weekend business hours. Confirm Saturday vs Sunday.",
         "result": "Agent provides weekend hours"},
    ]),
))

result = okareo.run_simulation(
    name="CI Gate - Voice Quality",
    target=Target(name="Voice Cookbook Target", target=TwilioVoiceTarget(to_phone_number=TARGET_PHONE)),
    scenario=scenario,
    driver=DEFAULT_DRIVER,
    max_turns=4,
    repeats=2,
    checks=["avg_turn_taking_latency", "result_completed", "response_loop"],
)

scores = result.model_metrics.to_dict().get("mean_scores", {})

THRESHOLDS = {
    "result_completed": 0.75,
    "response_loop": 0.75,
}

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")
print()
print("--- CI Gate Results ---")

failed = False
for check, threshold in THRESHOLDS.items():
    score = scores.get(check)
    if score is None:
        print(f"  {check}: MISSING — FAILED")
        failed = True
    elif score >= threshold:
        print(f"  {check}: {score:.2f} >= {threshold} — PASSED")
    else:
        print(f"  {check}: {score:.2f} < {threshold} — FAILED")
        failed = True

if failed:
    print("\nCI GATE: FAILED")
    sys.exit(1)
else:
    print("\nCI GATE: PASSED")
