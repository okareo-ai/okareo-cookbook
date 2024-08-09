import { runEvaluation } from "./utils";
import * as core from '@actions/core';

// name of Okareo artifacts + unique identifier
const SCENARIO_NAME = "Directives - Competitor Mentions (ADVERSARIAL_QUESTION)";
const SCENARIO_FILE_PATH = "./src/scenarios/competitor-questions-adversarial-scenario.jsonl";
const EVAL_NAME_BASE = "Directive Coverage: Competitor Mentions"
const CHECK_NAME = "behavior_adherence"

const report_definition = {
	pass_rate: {
		[CHECK_NAME]: 0.8,
	},
};

const main = async () => {
	try {
        await runEvaluation(
            SCENARIO_NAME,
            SCENARIO_FILE_PATH,
            EVAL_NAME_BASE,
            CHECK_NAME,
            report_definition
        );
    } catch (error) {
        // intentionally not blocking the build.
		core.setFailed("Failed: "+error);
	}
}
main();