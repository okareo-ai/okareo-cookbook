"""06 — Augmentation
Inject real-world conditions: background noise and barge-in.

Demonstrates:
- The augmentation parameter in run_simulation
- noise + barge_in combo (valid: noise + one non-noise strategy)
- No need to drop down to register_model/run_test for augmentation
"""
import os
from okareo import Okareo
from okareo.augmentations import Augmentation, NoiseAugmentation, BargeInAugmentation
from okareo_api_client.models import ScenarioSetCreate
from shared import TARGET, DEFAULT_DRIVER

okareo = Okareo(os.environ["OKAREO_API_KEY"])

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - Augmentation",
    seed_data=okareo.seed_data_from_list([
        {"input": "Cancel your gym membership #GYM-4421 ($49/mo) effective today. "
                  "Confirm no further charges.",
         "result": "Agent processes cancellation and confirms no further charges"}
    ]),
))

result = okareo.run_simulation(
    name="Augmentation - Noise + Barge-In",
    target=TARGET,
    scenario=scenario,
    driver=DEFAULT_DRIVER,
    max_turns=5,
    first_turn="driver",
    checks=["avg_turn_taking_latency", "result_completed"],
    calculate_metrics=True,
    augmentation=Augmentation(
        noise=NoiseAugmentation(profile="cafeteria", snr_db=10),
        barge_in=BargeInAugmentation(
            probability=0.5,
            min_offset_ms=200,
            max_offset_ms=600,
            prompt="Ask for a very short polite interruption.",
        ),
    ),
)

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")
