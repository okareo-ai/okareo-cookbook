import os
import tempfile 
from okareo import Okareo
from okareo.model_under_test import CustomModel
from okareo_api_client.models.test_run_type import TestRunType
from transformers import pipeline

OKAREO_API_KEY = os.environ['OKAREO_API_KEY']
OPENAI_API_KEY = os.environ['OPENAI_API_KEY']

# CONNECT TO OKAREO
okareo = Okareo(OKAREO_API_KEY)

# CREATE CUSTOM MODEL
class CustomGenerationModel(CustomModel):

    # Constructor
    def __init__(self, name):
        self.name=name
        self.summarizer = pipeline("summarization", model="facebook/bart-large-cnn")

    # Define the invoke method to be called on each input of a scenario
    def invoke(self, input: str) -> tuple:

        # call your model being tested using <input> from the scenario set
        result = self.summarizer(input, max_length=130, min_length=30, do_sample=False)[0]["summary_text"]

        # return a tuple of (model result, overall model response context)
        return result, {"model_response": "Generation successful" }  


# REGISTER MODEL
model_under_test = okareo.register_model(
    name="TEST_MODEL_NAME_1",
    model=CustomGenerationModel(name="Custom Generation model")
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
scenario = okareo.upload_scenario_set(file_path=file_path, scenario_name="TEST_SCENARIO_NAME_1")
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


