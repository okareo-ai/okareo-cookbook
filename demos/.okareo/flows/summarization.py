import os
import random
import string
from okareo import Okareo
from okareo.checks import CheckOutputType
from okareo.model_under_test import GenerationModel
from okareo_api_client.models.test_run_type import TestRunType
from prompts.meeting_summary import Prompts
from okareo_api_client.models import EvaluatorSpecRequest
from importlib import import_module

OKAREO_API_KEY = os.environ['OKAREO_API_KEY']
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']

UNIQUE_BUILD_ID = os.environ.get('DEMO_BUILD_ID', f'local.{"".join(random.sample(string.ascii_letters, 5))}')

custom_checks = [
	{
		"name": "summary_length",
		"description": "Return the length of model output in characters",
		"output_data_type": CheckOutputType.SCORE,
	},
	{
		"name": "under_350_characters",
		"description": "Pass if the property model output from the JSON model result has less than 350 characters.",
		"output_data_type": CheckOutputType.PASS_FAIL,
	},
	{
		"name": "word_count",
		"description": "Return the number of words in the model output",
		"output_data_type": CheckOutputType.SCORE,
	},
];

okareo = Okareo(OKAREO_API_KEY)
scenario = okareo.upload_scenario_set(
    scenario_name="Meeting Bank Small Dataset Test",
    file_path='./.okareo/flows/meetings_short_test.jsonl'
)
mut = okareo.register_model(
	name="Meeting Summarizer",
	model=GenerationModel(
        model_id="claude-3-5-sonnet-20240620",
		temperature=0.5,
		system_prompt_template=Prompts.get_summary_system_prompt(),
		user_prompt_template=Prompts.get_summary_user_prompt(),
	),
    update=True,
)
for check_info in custom_checks:
	generate_request = EvaluatorSpecRequest(
		description=check_info.get('description'),
		requires_scenario_input=True,
		requires_scenario_result=False,
		output_data_type=check_info.get('output_data_type').value
	)
	generated_test = okareo.generate_check(generate_request).generated_code
	exec(generated_test)
	file_path = f"./.okareo/flows/{check_info.get('name')}.py"
	with open(file_path, "w+") as file:
		file.write(generated_test)
	check_module = import_module(check_info.get('name'))
	Check = getattr(check_module, 'Check')
	token_cr_check = okareo.create_or_update_check(
		name=check_info.get('name'),
		check=Check(),
		description=check_info.get('description'),
	)
	os.remove(file_path)

custom_check_names = [check_info['name'] for check_info in custom_checks]

eval_run = mut.run_test(
    scenario=scenario,
    name=f"Meeting Summarizer Eval {UNIQUE_BUILD_ID}",
    test_run_type=TestRunType.NL_GENERATION,
    checks=['latency', 'fluency_summary'] + custom_check_names,
    api_key=ANTHROPIC_API_KEY
)
print(f'{eval_run.name} can be viewed at {eval_run.app_link}')