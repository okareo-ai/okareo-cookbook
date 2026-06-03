"""01 — First Voice Sim
Describe a caller in one sentence → get a real phone conversation back.

Demonstrates:
- AI-assisted driver prompt generation (describe caller → structured prompt)
- Running a voice simulation with minimal setup
- Only requires OKAREO_API_KEY
"""
import os
from okareo import Okareo
from okareo.model_under_test import Target, TwilioVoiceTarget
from okareo_api_client.models import ScenarioSetCreate
from shared import generate_driver_prompt, TARGET_PHONE

okareo = Okareo(os.environ["OKAREO_API_KEY"])

# One sentence → production-quality driver with voice tone
driver = generate_driver_prompt(
    "Confused elderly customer calling about an unexpected charge on their phone bill"
)

print(f"Generated driver: {driver.name}")
print(f"Prompt preview: {driver.prompt_template[:120]}...")

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - First Call",
    seed_data=okareo.seed_data_from_list([
        {"input": "I have an unexpected $47 charge on my bill from last month.", "result": "Agent explains the charge"}
    ]),
))

result = okareo.run_simulation(
    name="First Voice Sim",
    target=Target(name="Voice Cookbook Target", target=TwilioVoiceTarget(to_phone_number=TARGET_PHONE)),
    scenario=scenario,
    driver=driver,
    max_turns=4,
    checks=["avg_turn_taking_latency"],
)

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")
