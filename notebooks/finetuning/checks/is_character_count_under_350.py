from okareo.checks import CodeBasedCheck


class Check(CodeBasedCheck):
    @staticmethod
    def evaluate(model_output: str) -> bool:
        return len(model_output) < 350