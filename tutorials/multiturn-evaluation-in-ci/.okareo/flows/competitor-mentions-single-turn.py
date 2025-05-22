import os
from importlib import import_module

from okareo import Okareo
from okareo.checks import CheckOutputType
from okareo.model_under_test import GenerationModel
from okareo_api_client.models.test_run_type import TestRunType
from okareo_api_client.models import EvaluatorSpecRequest
from prompt_leak_protection import Check


# Set up API keys from environment variables
OKAREO_API_KEY = os.environ['OKAREO_API_KEY']
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']


# Initialize Okareo client
okareo = Okareo(OKAREO_API_KEY)

# Upload scenario set for testing
scenario = okareo.upload_scenario_set(
    scenario_name="Brand Risk: Competitor Questions (single-turn)",
    file_path='./src/scenarios/competitor-questions-scenario_v2.jsonl'
)

with open('src/directives/target-directives.txt', 'r', encoding='utf-8') as file:
    TARGET_DIRECTIVES = file.read()

with open('src/directives/target-context.txt', 'r', encoding='utf-8') as file:
    TARGET_CONTEXT = file.read()

# Register the model under test
mut = okareo.register_model(
	name="Cookbook OpenAI WebBizz",
	model=GenerationModel(
        model_id="gpt-3.5-turbo",
		temperature=0,
		system_prompt_template= TARGET_DIRECTIVES + "\n\n" + TARGET_CONTEXT,
        user_prompt_template="{input}"
	),
    update=True,
)



# Run the evaluation
eval_run = mut.run_test(
    scenario=scenario,
    name="Brand Risk: Competitor Questions (single-turn)",
    test_run_type=TestRunType.NL_GENERATION,
    checks=['behavior_adherence'] ,
    api_key=OPENAI_API_KEY
)

print(f'{eval_run.name} can be viewed at {eval_run.app_link}')

