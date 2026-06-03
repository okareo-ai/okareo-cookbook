"""08 — Load/Scale Test
Stress-test with 20 concurrent conversations and measure latency degradation.

Demonstrates:
- High-volume testing with repeats * scenarios
- max_parallel_requests on the target to control concurrency
- Reading server-calculated percentile scores (p50, p90)
- Detecting performance degradation under load
"""
import os
from okareo import Okareo
from okareo.model_under_test import Target, TwilioVoiceTarget
from okareo_api_client.models import ScenarioSetCreate, FindTestDataPointPayload
from shared import DEFAULT_DRIVER, TARGET_PHONE

okareo = Okareo(os.environ["OKAREO_API_KEY"])

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - Load Test",
    seed_data=okareo.seed_data_from_list([
        {"input": "What's your account balance?", "result": "Agent provides balance"},
        {"input": "When does your subscription renew?", "result": "Agent provides renewal date"},
        {"input": "Get a copy of your last invoice.", "result": "Agent sends invoice"},
        {"input": "Is there a fee to upgrade your plan?", "result": "Agent explains upgrade costs"},
    ]),
))

result = okareo.run_simulation(
    name="Load Test - Voice Quality",
    target=Target(name="Voice Cookbook Target", target=TwilioVoiceTarget(to_phone_number=TARGET_PHONE, max_parallel_requests=4)),
    scenario=scenario,
    driver=DEFAULT_DRIVER,
    max_turns=3,
    repeats=5,
    checks=["avg_turn_taking_latency", "result_completed"],
)

metrics = result.model_metrics.to_dict()
scores = metrics.get("mean_scores", {})
percentiles = metrics.get("percentile_scores", {})

latency_pct = percentiles.get("avg_turn_taking_latency", percentiles.get("avg_turn_latency", {}))

datapoints = okareo.find_test_data_points(
    FindTestDataPointPayload(test_run_id=result.id, full_data_point=True)
)

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")
print(f"\n--- Load Test Results ---")
print(f"  Conversations: {len(datapoints)} (4 scenarios x 5 repeats = 20 expected)")
print(f"  Mean latency:       {scores.get('avg_turn_taking_latency', 'N/A')} ms")

if latency_pct:
    print(f"  p50 latency:        {latency_pct.get('p50', 'N/A')} ms")
    print(f"  p90 latency:        {latency_pct.get('p90', 'N/A')} ms")
    p90 = latency_pct.get("p90")
    if p90 and p90 > 3000:
        print(f"\n  WARNING: p90 latency ({p90:.0f}ms) exceeds 3000ms threshold")
    else:
        print(f"\n  Latency within acceptable range")
else:
    print(f"  (percentile scores not available — check model_metrics)")

print(f"  result_completed:   {scores.get('result_completed', 'N/A')}")
