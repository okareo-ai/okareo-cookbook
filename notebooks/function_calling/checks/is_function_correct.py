import json
from okareo.checks import CodeBasedCheck

class Check(CodeBasedCheck):
    @staticmethod
    def evaluate(model_output: str, scenario_result: str) -> bool:
        try:
            tool_call = json.loads(model_output)["tool_calls"][0]
            generated_func = tool_call["name"]
            scenario_func = json.loads(scenario_result)["name"]
            return generated_func == scenario_func
        except Exception as e:
            print(f"Failed to parse JSON 'Is Function Correct' check. Exception: {e}")
            return False
