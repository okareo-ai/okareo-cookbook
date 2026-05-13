# Authenticate
import os
from okareo import Okareo
from okareo_api_client.models import ScenarioSetCreate

OKAREO_API_KEY = os.environ["OKAREO_API_KEY"]
okareo = Okareo(api_key=OKAREO_API_KEY)
project_id = next(project.id for project in okareo.get_projects() if project.name == "Global")

# You have a working connection to Okareo
print(f"""Connected to Okareo
    with key: {OKAREO_API_KEY[:4]}...{OKAREO_API_KEY[-4:]}
    and project: {project_id}""")

# From a jsonl file.
# okareo.upload_scenario_set(
#     scenario_name="Travel Scenario",
#     file_path="./travel-concierge-scenario.jsonl",
#     project_id=project_id,
# )

seed_data = okareo.seed_data_from_list([
    {"input": {"location": "San Diego", "name": "Karlee Xu", "origin": "San Jose", "activity": "vacation"}, "result": "Provide an itinerary for traveling to the location for the identified activity"},
    {"input": {"location": "Paris", "name": "Liam Carter", "origin": "Chicago", "activity": "business trip"}, "result": "Liam Carter will depart from Chicago to Paris, attend meetings with partners for three days, and visit local landmarks like the Eiffel Tower in the evenings."},
    {"input": {"location": "Tokyo", "name": "Sophia Nguyen", "origin": "Vancouver", "activity": "study abroad"}, "result": "Sophia Nguyen is traveling from Vancouver to Tokyo to enroll in a language program, attend lectures at a local university, and explore cultural sites during weekends."},
])
scenario = okareo.create_scenario_set(ScenarioSetCreate(name="Travel Scenario", seed_data=seed_data))

print(f"\nScenario ID: {scenario.scenario_id}")