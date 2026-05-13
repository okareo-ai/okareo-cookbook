# Read-only preview of how to run this simulation with the Okareo SDK.
# Assumes the SDK is installed (`pip install okareo`) and your environment
# is configured (OKAREO_API_KEY and the LLM provider key set).

import os
from okareo import Okareo
from okareo.model_under_test import (
    Target,
)
from okareo.model_under_test import CustomEndpointTarget, TurnConfig, Target, TestRunType, Target, StopConfig
from okareo_api_client.models.scenario_set_create import ScenarioSetCreate
from okareo_api_client.models.seed_data import SeedData


print(f"Using Okareo API key: {os.environ['OKAREO_API_KEY'][:4]}...")
okareo = Okareo(os.environ["OKAREO_API_KEY"])

print("Starting simulation")

travel_concierge_target = okareo.get_model("Travel Concierge")

scenario = okareo.create_scenario_set(ScenarioSetCreate(name="Travel Scenario (1 Row)", seed_data=okareo.seed_data_from_list([ {"input":"input", "result": "result"}])))
print(f"\nScenario ID: {scenario.scenario_id}")

test_run = travel_concierge_target.run_test(
    name="Travel Concierge Generation",
    scenario=scenario.scenario_id,
    test_run_type=TestRunType.NL_GENERATION,
    checks=["result_completed"],
)
print(f"See results in Okareo app: {test_run.app_link}")
