import { 
    Okareo, 
    RunTestProps, components,
    TestRunType, OpenAIModel,
    GenerationReporter, CheckOutputType, JSONReporter
} from "okareo-ts-sdk";
import * as core from '@actions/core';

import { prompts } from './prompts/meeting_summary';
import { CHECK_TYPE, register_checks } from './utils/check_utils';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);

const PROJECT_NAME = "Global";
const MODEL_NAME = "Meeting Summarizer";

const required_checks: CHECK_TYPE[] = [
	{
		name: "demo.Summary.Length",
		description: "Return the length of the short_summary property from the JSON model response.",
		output_data_type: CheckOutputType.SCORE,
	},
	{
		name: "demo.Summary.Under256",
		description: "Pass if the property short_summary from the JSON model result has less than 256 characters.",
		output_data_type: CheckOutputType.PASS_FAIL,
	},
	{
		name:"demo.Summary.JSON",
		description: "Pass if the model result is JSON with the properties short_summary, actions, and attendee_list.",
		output_data_type: CheckOutputType.PASS_FAIL,
	},
	{
		name:"demo.Attendees.Length",
		description: "Return the length of the number of particpants in the attendee_list in the JSON model response.",
		output_data_type: CheckOutputType.SCORE,
	},
	{
		name:"demo.Actions.Length",
		description: "Return the length of the number of actions in the JSON model response.",
		output_data_type: CheckOutputType.SCORE,
	},
	{
		name:"demo.Tone.IsFriendly",
		description: "Use a model judgement to determine if the tone in the meeting is friendly (true).",
		prompt: "Only output True if the speakers in the following meeting are friendly, otherwise return False: {generation}",
		output_data_type: CheckOutputType.PASS_FAIL,
	},
];

const report_definition = {
	metrics_min: {
		"consistency": 4.0,
		"relevance": 4.0,
		"demo.Attendees.Length": 2,
		"demo.Actions.Length": 2,
	},
	metrics_max: {
		"demo.Summary.Length": 256,
	},
	pass_rate: {
		"demo.Summary.Under256": 0.75,
		"demo.Summary.JSON": 1,
		"demo.Tone.Friendly": 1,
	},
};

const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
		const pData: any[] = await okareo.getProjects();
		const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

		register_checks(okareo, project_id, required_checks);

		const meeting_scenario: any = await okareo.upload_scenario_set({
			name: "Meeting Bank Small Data Set",
			file_path: "./.okareo/flows/meetings.jsonl",
			project_id: project_id,
		});
		
		const model = await okareo.register_model({
		name: MODEL_NAME,
		tags: ["Demo", "Summaries", `Build:${UNIQUE_BUILD_ID}`],
		project_id: project_id,
		models: {
			type: "openai",
			model_id:"gpt-3.5-turbo",
			temperature:0.5,
			system_prompt_template:prompts.getSummarySystemPrompt(),
			user_prompt_template:prompts.getSummaryUserPrompt(),
		} as OpenAIModel,
		update: true,
		});
		
		const eval_run: components["schemas"]["TestRunItem"] = await model.run_test({
			model_api_key: OPENAI_API_KEY,
			name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
			tags: ["Demo", "Summaries", `Build:${UNIQUE_BUILD_ID}`],
			project_id: project_id,
			scenario: meeting_scenario,
			calculate_metrics: true,
			type: TestRunType.NL_GENERATION,
			checks: [
				"consistency_summary",
				"relevance_summary",
				...required_checks.map(c => c.name),
			]
		} as RunTestProps);

		const reporter = new GenerationReporter({
				eval_run :eval_run, 
				...report_definition,
		});
		reporter.log();

        const reporter_output = new JSONReporter({
            eval_runs:[ eval_run ]
        });
        reporter_output.log();
		
		if (!reporter.pass) {
			// intentionally not blocking the build.
			console.log("The model did not pass the evaluation. Please review the results.");
			//core.setFailed("The model did not pass the evaluation. Please review the results.");
		}

	} catch (error) {
        // intentionally not blocking the build.
		core.setFailed("Failed: "+error);
	}
}
main();




