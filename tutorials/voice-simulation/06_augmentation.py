"""06 — Augmentation
Inject real-world conditions: background noise and barge-in.

Demonstrates:
- The augmentation block in simulation_params (not deprecated top-level params)
- noise + barge_in combo (valid: noise + one non-noise strategy)
- Using ModelUnderTest.run_test() for advanced sim configuration
"""
import os
from okareo import Okareo
from okareo.model_under_test import TwilioVoiceTarget, TestRunType
from okareo_api_client.models import ScenarioSetCreate
from shared import TARGET_PHONE, DEFAULT_DRIVER

okareo = Okareo(os.environ["OKAREO_API_KEY"])

mut = okareo.register_model(
    name="Voice Cookbook Target",
    model=TwilioVoiceTarget(to_phone_number=TARGET_PHONE),
    update=True,
)

driver_model = okareo.create_or_update_driver(DEFAULT_DRIVER)

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - Augmentation",
    seed_data=okareo.seed_data_from_list([
        {"input": "Cancel your gym membership #GYM-4421 ($49/mo) effective today. "
                  "Confirm no further charges.",
         "result": "Agent processes cancellation and confirms no further charges"}
    ]),
))


class AugmentedSimParams:
    """simulation_params with augmentation block.

    Composition rule: max 2 strategies. If 2, one must be noise.
    Valid combos: noise+barge_in, noise+cap, noise+backchannel, etc.
    """
    def to_dict(self):
        return {
            "max_turns": 5,
            "first_turn": "driver",
            "repeats": 1,
            "augmentation": {
                "noise": {"profile": "cafeteria", "snr_db": 10},
                "barge_in": {
                    "probability": 0.5,
                    "min_offset_ms": 200,
                    "max_offset_ms": 600,
                    "prompt": "Ask for a very short polite interruption.",
                },
            },
        }


result = mut.run_test(
    scenario=scenario,
    name="Augmentation - Noise + Barge-In",
    test_run_type=TestRunType.MULTI_TURN,
    checks=["avg_turn_taking_latency", "result_completed"],
    calculate_metrics=True,
    simulation_params=AugmentedSimParams(),
    driver_id=str(driver_model.id),
)

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")
