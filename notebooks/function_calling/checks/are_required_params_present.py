import json
from okareo.checks import CodeBasedCheck

class Check(CodeBasedCheck):
    @staticmethod
    def evaluate(model_output: str, scenario_result: str) -> bool:
        try:
            tool_call = json.loads(model_output)["tool_calls"][0]
            generated_params = tool_call["parameters"]
            scenario_params = json.loads(scenario_result)["parameter_definitions"]
            for param, d in scenario_params.items():
                if d['required'] and param not in generated_params.keys():
                    return False
            return True
        except Exception as e:
            print(f"Failed to parse JSON 'Are Required Parameters Present' check. Exception: {e}")
            return False