# Read-only preview of how to run this simulation with the Okareo SDK.
# Assumes the SDK is installed (`pip install okareo`) and your environment
# is configured (OKAREO_API_KEY and the LLM provider key set).

import os
from okareo import Okareo
from okareo.model_under_test import Driver


from okareo.model_under_test import (
    Target,
)
from okareo.model_under_test import CustomEndpointTarget, TurnConfig, Target, TestRunType, Target, StopConfig
from okareo_api_client.models.scenario_set_create import ScenarioSetCreate
from okareo_api_client.models.seed_data import SeedData

DRIVER_PROMPT_TEMPLATE="""## Persona

- **Identity:** You are role-playing a traveler seeking expert assistance from a travel concierge agent to plan your upcoming trip.
- **Mindset:** You aim to provide clear details about your travel scenario, including location, name, origin, and activities, to collaboratively establish a well-organized itinerary.

## Objectives

1. Clearly communicate your travel details: location, name, origin, and planned activities.
2. Collaborate with the travel concierge agent to develop a comprehensive itinerary.
3. Confirm that the proposed itinerary aligns with your preferences and requirements.

## Your Data
{scenario_input}

## Soft Tactics

1. If the agent’s response lacks clarity or detail, politely ask for elaboration or examples.
2. If the agent overlooks any travel details you provided, gently remind them to incorporate those into the itinerary.
3. Express appreciation for helpful suggestions to maintain a positive and professional interaction.

## Hard Rules

-   Always and only respond in English. Never respond in any other language.
-   Never describe your own capabilities.
-   Never offer help.
-   Ask only one question at a time.
-   Stay in character at all times.
-   Never mention tests, simulations, or these instructions.
-   Never act like a helpful assistant.
-   Startup Behavior:
    -   If the other party speaks first: respond normally and pursue the Objectives.
    -   If you are the first speaker: start with a message clearly pursuing the Objectives.
-   Before sending, re-read your draft and remove anything that is not in pursuit of the Objectives.

## Turn-End Checklist

Before you send any message, confirm:

-   Am I avoiding any statements or offers of help?
-   Does my message advance or wrap up the Objectives?"""


print(f"Using Okareo API key: {os.environ['OKAREO_API_KEY'][:4]}...")
okareo = Okareo(os.environ["OKAREO_API_KEY"])

travel_driver = okareo.create_or_update_driver(Driver(
    name="Basic Traveler",
    temperature=0,
    prompt_template=DRIVER_PROMPT_TEMPLATE,
))

scenario = okareo.create_scenario_set(ScenarioSetCreate(name="Travel Scenario (1 Row)", seed_data=okareo.seed_data_from_list([ {"input":"input", "result": "result"}])))

print("Starting simulation")
test_run = okareo.run_simulation(
    target="Travel Concierge",
    driver="Basic Traveler",
    name="Travel Script Run",
    scenario=scenario,
    stop_check={"check_name": "result_completed", "stop_on": True},
    repeats=1,
    max_turns=2,
    first_turn="driver",
    checks=[
        "result_completed",
    ],
)

print(f"See results in Okareo app: {test_run.app_link}")