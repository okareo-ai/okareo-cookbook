import os
from importlib import import_module
from prompts.meeting_summary import Prompts

from okareo import Okareo
from okareo.checks import CheckOutputType
from okareo.model_under_test import GenerationModel
from okareo_api_client.models.test_run_type import TestRunType
from okareo_api_client.models import EvaluatorSpecRequest

# Set up API keys from environment variables
OKAREO_API_KEY = os.environ['OKAREO_API_KEY']
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']

# Define model IDs and names for different Claude 3 versions
opus_model_id = "claude-3-opus-20240229"
opus_model_name = "Claude 3 Opus"

sonnet_model_id = "claude-3-sonnet-20240229"
sonnet_model_name = "Claude 3 Sonnet"

haiku_model_id = "claude-3-haiku-20240307"
haiku_model_name = "Claude 3 Haiku"

# Select the model to use (currently set to Haiku)
model_id = opus_model_id
model_name = opus_model_name

# Define custom checks for evaluation
custom_checks = [
	{
		"name": "character_count",
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
]

# Initialize Okareo client
okareo = Okareo(OKAREO_API_KEY)

# Upload scenario set for testing
scenario = okareo.upload_scenario_set(
    scenario_name="Meeting Bank Summaries (Test)",
    file_path='./.okareo/flows/Meeting_Bank_Summaries_test.jsonl'
)

# Register the model under test
mut = okareo.register_model(
	name=f"{model_name} (Summarization)",
	model=GenerationModel(
        model_id=model_id,
		temperature=0,
		system_prompt_template=Prompts.get_summary_system_prompt(),
		user_prompt_template=Prompts.get_summary_user_prompt(),
	),
    update=True,
)

# Get all existing checks
all_checks = okareo.get_all_checks()
all_check_names = [check.name for check in all_checks]

# Create or update custom checks
for check_info in custom_checks:
	# Skip generating checks that already exist
	if check_info['name'] in all_check_names:
		continue
	
	# Generate checks
	generated_test = okareo.generate_check(EvaluatorSpecRequest(
		description=check_info.get('description'),
		requires_scenario_input=True,
		requires_scenario_result=False,
		output_data_type=check_info.get('output_data_type').value
	)).generated_code
	file_path = f"./.okareo/flows/{check_info.get('name')}.py"
	with open(file_path, "w+") as file:
		file.write(generated_test)
	check_module = import_module(check_info.get('name'))
	Check = getattr(check_module, 'Check')
	okareo.create_or_update_check(
		name=check_info.get('name'),
		check=Check(),
		description=check_info.get('description'),
	)
	os.remove(file_path)

# Get the names of all custom checks
custom_check_names = [check_info['name'] for check_info in custom_checks]

# Run the evaluation
eval_run = mut.run_test(
    scenario=scenario,
    name=f"Summarization Run (test split) for {model_name}",
    test_run_type=TestRunType.NL_GENERATION,
    checks=['latency', 'consistency_summary'] + custom_check_names,
    api_key=ANTHROPIC_API_KEY
)

print(f'{eval_run.name} can be viewed at {eval_run.app_link}')