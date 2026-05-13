#!/usr/bin/env python3
import os
from okareo import Okareo

from okareo.reporter import JSONReporter
from okareo_api_client.models.scenario_set_create import ScenarioSetCreate

OKAREO_API_KEY = os.environ["OKAREO_API_KEY"]

okareo = Okareo(OKAREO_API_KEY)
print(f"""Connected to Okareo
    with key: {OKAREO_API_KEY[:4]}...{OKAREO_API_KEY[-4:]}""")

scenario = okareo.create_scenario_set(ScenarioSetCreate(name="Travel Plans (1 Row)", seed_data=okareo.seed_data_from_list([ {"input":"input", "result": "result"}])))

print("Starting simulation")
test_run = okareo.run_simulation(
    target="Travel Concierge",
    driver="Basic Traveler",
    name="Travel Automated Simulation",
    scenario=scenario,
    stop_check={"check_name": "result_completed", "stop_on": True},
    repeats=1,
    max_turns=6,
    first_turn="driver",
    checks=[
        "result_completed",
    ],
)

# Set OKAREO_REPORT_DIR to save this output to a file that can be parsed by CI tools.
reporter = JSONReporter([test_run])
reporter.log()
