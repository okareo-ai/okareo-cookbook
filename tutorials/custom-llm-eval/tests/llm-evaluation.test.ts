import { 
	Okareo, 
	RunTestProps, 
	components,
    TestRunType, 
    OpenAIModel,
    CheckOutputType,
    GenerationReporter,
} from "okareo-ts-sdk";
import { prompts } from "../prompts/meeting_summary"
import { CHECK_TYPE, register_checks } from '../tests/utils/check_utils';
//GitHub Actions
import * as core from "@actions/core";

//env vars
const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);

// names
const PROJECT_NAME = "Global";
const MODEL_NAME = "Meeting Summarizer";
const SCENARIO_SET_NAME = "Meeting Bank Small Data Set";

describe('Evaluations', () => {
     test('Meeting Summarization', async () =>  {
     	try {
     		// setup Okareo
     		const okareo = new Okareo({api_key: OKAREO_API_KEY });
			const project: any[] = await okareo.getProjects();
			const project_id = project.find(p => p.name === PROJECT_NAME)?.id;

            // register model
	        const model = await okareo.register_model({
				name: MODEL_NAME,
				tags: [`Build:${UNIQUE_BUILD_ID}`],
				project_id: project_id,
				models: {
					type: "openai",
					model_id:"gpt-3.5-turbo",
					temperature:0.5,
					system_prompt_template:prompts.getCustomSystemPrompt(),
					user_prompt_template:prompts.getUserPromptTemplate(),
				} as OpenAIModel,
				update: true,
			});

             //upload scenario set (from file)
	        const scenario: any = await okareo.upload_scenario_set(
	            {
	            	name: `${SCENARIO_SET_NAME} Scenario Set - ${UNIQUE_BUILD_ID}`,
	            	file_path: "./tests/meetings.jsonl",
	            	project_id: project_id,
	            }
	        );

            // // define your custom checks
			const custom_checks: CHECK_TYPE[] = [
				{
					name: "demo.Summary.Length",
					description: "Return the length of the short_summary property from the JSON model response.",
					output_data_type: CheckOutputType.SCORE,
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
					name:"demo.Tone.IsFriendly", // Peer evaluation check (another LLM checks the behaviour of your LLM)
					description: "Use a model judgement to determine if the tone in the meeting is friendly (true).",
                         prompt: "Only output True if the speakers in the following meeting are friendly, otherwise return False: {generation}",
					output_data_type: CheckOutputType.PASS_FAIL,
				},
			];

			// register custom checks with Okareo
			register_checks(okareo, project_id, custom_checks);

	        // name the checks you will use with your evaluation
	        const checks = [
				"coherence_summary", // Okareo native check
				"consistency_summary", // Okareo native check
				"fluency_summary", // Okareo native check
				"relevance_summary", // Okareo native check
				...custom_checks.map(c => c.name), // custom checks
			]

	        // run LLM evaluation
			const eval_run: components["schemas"]["TestRunItem"] = await model.run_test({
				model_api_key: OPENAI_API_KEY,
				name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
				tags: [`Build:${UNIQUE_BUILD_ID}`],
				project_id: project_id,
				scenario: scenario,
				calculate_metrics: true,
				type: TestRunType.NL_GENERATION,
				checks: checks
			} as RunTestProps);


			//test that evaluation has run
	        expect(eval_run).toBeDefined();

			// define thresholds for reporting
			const thresholds = {
				metrics_min: {
					"coherence_summary": 4.0,
					"consistency_summary": 4.0,
					"fluency_summary": 4.0,
					"relevance_summary": 4.0,
				},
				metrics_max: {
					"demo.summary.Length": 256,
				},
				pass_rate: {
					"demo.Tone.IsFriendly": 1,
				},
				error_max: 3,
			};

			// create reporter and pass thresholds to it
			const reporter = new GenerationReporter({
					eval_run :eval_run, 
					...thresholds,
			});
			reporter.log(); // log reporting output to command line
			
			// assert that evaluation must pass
			expect(reporter.pass).toBeTruthy();

		} catch (error) {
			if (error instanceof Error) {
			    core.setFailed("CI failed because: " + error.message);
			  } else {
			    core.setFailed("CI failed due to an unknown error");
			  }
		}	
    }, 100000);
});
