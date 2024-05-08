import { 
    Okareo, 
    RunTestProps,
    TestRunType, OpenAIModel,
    generation_reporter,
} from "okareo-ts-sdk";

import { prompts } from '../../src/prompts/meeting_summary';
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
		output_data_type: "int"
	},
	{
		name: "demo.Summary.Under256",
		description: "Pass if the property short_summary from the JSON model result has less than 256 characters.",
		output_data_type: "bool"
	},
	{
		name:"demo.Summary.JSON",
		description: "Pass if the model result is JSON with the properties short_summary, actions, and attendee_list.",
		output_data_type: "bool"
	},
];

const report_definition = {
	metrics_min: {
		"consistency": 4.0,
		"relevance": 4.4,
	},
	metrics_max: {
		"demo.Summary.Length": 256,
	},
	pass_rate: {
		"demo.Summary.Under256": 0.75,
		"demo.Summary.JSON": 1,
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
		
		const eval_run: any = await model.run_test({
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
		
		const report = generation_reporter({
			eval_run:eval_run, 
			...report_definition,
		});
		
		console.log(`\nEval: ${eval_run.name} - ${(report.pass)?"Pass 🟢" : "Fail 🔴"}`);
		Object.keys(report.fail_metrics).map(m => {
			const fMetrics: any = report.fail_metrics;
			if (Object.keys(fMetrics[m]).length > 0) {
				console.log(`\nFailures for ${m}`);
				console.table(fMetrics[m]);
			};
		});
		console.log(eval_run.app_link);
		
		if (!report.pass) {
			throw new Error("The model did not pass the evaluation. Please review the results.");
		}

	} catch (error) {
		throw new Error(error);
	}
}
main();




