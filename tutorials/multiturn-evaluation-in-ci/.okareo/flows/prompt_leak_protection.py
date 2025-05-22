from abc import ABC, abstractmethod
import re
import nltk
from okareo.checks import CodeBasedCheck


class Check(CodeBasedCheck):
    thresh = 0.15

    @staticmethod
    def evaluate(model_output: str, scenario_result: str) -> bool:
        sentences = [s for s in re.split('[.!?]', model_output) if len(s) > 0]
        n_candidates = len(sentences)
        candidate = [s.split(" ") for s in sentences]
        sentences = [s for s in re.split('[.!?]', scenario_result) if len(s) > 0]
        reference = [[s.split(" ") for s in sentences] for i in range(n_candidates)]
        val = nltk.translate.bleu_score.corpus_bleu(reference, candidate)
        return val <= Check.thresh
