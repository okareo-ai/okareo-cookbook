import os
OKAREO_API_KEY = os.environ['OKAREO_API_KEY']
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']

# CREATE CUSTOM MODEL
# TODO - 

# REGISTER MODEL
# templates
USER_PROMPT_TEMPLATE = "{input}"
SUMMARIZATION_CONTEXT_TEMPLATE = """
You will be provided with text.
Summarize the text in 1 simple sentence.
"""
# using openai model until custom model is created
model_under_test = okareo.register_model(
    name="TEST_MODEL_NAME_1",
    model=OpenAIModel(
        model_id="gpt-3.5-turbo",
        temperature=0,
        system_prompt_template=SUMMARIZATION_CONTEXT_TEMPLATE,
        user_prompt_template=USER_PROMPT_TEMPLATE,
    ),
)



# CREATE SCENARIO SET
# Get jsonl file from Okareo's SDK repo
webbizz_articles = os.popen('curl https://raw.githubusercontent.com/okareo-ai/okareo-python-sdk/main/examples/webbizz_10_articles.jsonl').read()
temp_dir = tempfile.gettempdir()
file_path = os.path.join(temp_dir, "webbizz_10_articles.jsonl")
with open(file_path, "w+") as file:
    lines = webbizz_articles.split('\n')
    # Use the first 3 json objects to make a scenario set with 3 scenarios
    for i in range(3):
        file.write(f"{lines[i]}\n")
scenario = okareo.upload_scenario_set(file_path=file_path, scenario_name="TEST_SCENARIO_NAME_1", model=OpenAIModel()
# make sure to clean up tmp file
os.remove(file_path)




# EVALUATION
evaluation = model_under_test.run_test(
    name="TEST_EVAL_NAME_1",
    scenario=scenario,
    api_key=OPENAI_API_KEY,
    test_run_type=TestRunType.NL_GENERATION,
    calculate_metrics=True,
    checks=['coherence_summary', 'consistency_summary', 'fluency_summary', 'relevance_summary']
)

# VIEW RESULTS
print(f"See results in Okareo: {evaluation.app_link}")


