"""03 — Checks
Apply quality checks: resolution, consistency, loops — not just latency numbers.

Demonstrates:
- Multiple voice-specific checks applied to a single simulation
- Reading and interpreting check results from model_metrics
- Understanding what each check measures
"""
import os
from okareo import Okareo
from okareo.model_under_test import Target, TwilioVoiceTarget
from okareo_api_client.models import ScenarioSetCreate
from shared import DEFAULT_DRIVER, TARGET_PHONE

okareo = Okareo(os.environ["OKAREO_API_KEY"])

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - Checks Demo",
    seed_data=okareo.seed_data_from_list([
        {"input": "Order #8812, paid $79.99, blender model BX-200. "
                  "Find out the refund status. You want a refund, not a replacement.",
         "result": "Agent processes refund for defective blender"}
    ]),
))

CHECKS = [
    "avg_turn_taking_latency",
    "result_completed",
    "response_consistency",
    "total_turn_count",
    "response_loop",
]

result = okareo.run_simulation(
    name="Voice Checks Demo",
    target=Target(name="Voice Cookbook Target", target=TwilioVoiceTarget(to_phone_number=TARGET_PHONE)),
    scenario=scenario,
    driver=DEFAULT_DRIVER,
    max_turns=5,
    checks=CHECKS,
    calculate_metrics=True,
)

scores = result.model_metrics.to_dict().get("mean_scores", {})

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")
print()
print("--- Check Results ---")
print(f"  avg_turn_taking_latency: {scores.get('avg_turn_taking_latency', 'N/A')} ms")
print(f"    ^ Average time between user finishing and agent responding")
print(f"  result_completed:        {scores.get('result_completed', 'N/A')}")
print(f"    ^ Did the agent fulfill the caller's objective? (1=yes, 0=no)")
print(f"  response_consistency:    {scores.get('response_consistency', 'N/A')}")
print(f"    ^ Were the agent's responses coherent and non-contradictory? (1=yes, 0=no)")
print(f"  total_turn_count:        {scores.get('total_turn_count', 'N/A')}")
print(f"    ^ Number of conversational turns in the call")
print(f"  response_loop:           {scores.get('response_loop', 'N/A')}")
print(f"    ^ Did the agent get stuck repeating itself? (1=no loop, 0=looped)")
