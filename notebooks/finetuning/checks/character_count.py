from okareo.checks import CodeBasedCheck


class Check(CodeBasedCheck):
    @staticmethod
    def evaluate(model_output: str) -> int:
        return len(model_output)