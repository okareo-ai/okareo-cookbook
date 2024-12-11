import os
import random
import string
import re

from okareo import Okareo
from okareo_api_client.models.scenario_set_create import ScenarioSetCreate
from okareo_api_client.models.seed_data import SeedData
from okareo.model_under_test import CustomModel, ModelInvocation
from okareo_api_client.models.test_run_type import TestRunType

OKAREO_API_KEY = os.environ.get("OKAREO_API_KEY")
if not OKAREO_API_KEY:
    raise ValueError("OKAREO_API_KEY environment variable is not set")
okareo = Okareo(OKAREO_API_KEY)

def random_string(length: int) -> str:
    return "".join(random.choices(string.ascii_letters, k=length))

# Scenario datapoints - test cases for your evaluation - sample inputs paired with "gold standard" results
scenario_data = [
    SeedData(
        input_="can you delete my account? my name is Bob",
        result={"function": {"name": "delete_account", "arguments": { "username": "Bob" }, "__required": ["username"]}},
    ),
    SeedData(
        input_="can you delete my account? my name is john",
        result={"function": {"name": "delete_account", "arguments": { "username": "John" }, "__required": ["username"]}},
    ),
    SeedData(
        input_="how do I make an account? my name is Alice",
        result={"function": {"name": "create_account", "arguments": { "username": "Alice"}, "__required": ["username"]}},
    ),
    SeedData(
        input_="how do I create an account?",
        result={"function": {"name": "create_account", "arguments": { "username": ".+" }, "__required": ["username"]}},
    ),
    SeedData(
        input_="my name is steve. how do I create a project?",
        result={"function": {"name": "create_account", "arguments": { "username": "Steve" }, "__required": ["username"]}},
    ),
]

tool_scenario = okareo.create_scenario_set(
    ScenarioSetCreate(
        name=f"Function Call Demo Scenario - {random_string(5)}",
        seed_data=scenario_data,
    ) 
)

print(f"See your scenario in Okareo: {tool_scenario.app_link}")


# A custom model created for this example
# (you can also use out-of-the-box models like those of OpenAI)
class FunctionCallModel(CustomModel):
    def __init__(self, name):
        super().__init__(name)
        self.usernames = ["Bob", "Alice", "John"]
        self.pattern = r'my name is (\S+)'

    def invoke(self, input_value):
        out = {"tool_calls": []}
        function_call = {"name": "unknown"}

        # parse out the function name
        if "delete" in input_value:
            function_call["name"] = "delete_account"
        if "create" in input_value:
            function_call["name"] = "create_account"

        # parse out the function argument
        match = re.search(self.pattern, input_value)
        if match:
            username = match.group(1)
            function_call["arguments"] = {"username": username}

        tool_call = {
            "function": function_call
        }

        # package the tool call and return
        out["tool_calls"].append(tool_call)
        return ModelInvocation(
            model_input=input_value,
            tool_calls=out["tool_calls"]
        )

# Register the model to use in the test run
model_under_test = okareo.register_model(
    name="Model that uses function calling",
    model=[FunctionCallModel(name=FunctionCallModel.__name__)],
    update=True
)


# Run the LLM evaluation (this uses the scenario, model, and checks)
evaluation = model_under_test.run_test(
    name="Function call evaluation",
    scenario=tool_scenario.scenario_id,
    test_run_type=TestRunType.NL_GENERATION,
    checks=["function_call_validator",
            "is_function_correct",
            "are_all_params_expected",
            "are_required_params_present",
            "do_param_values_match"]
)
print(f"See results in Okareo: {evaluation.app_link}")


