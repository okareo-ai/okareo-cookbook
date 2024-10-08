import { 
    Okareo, 
    UploadEvaluatorProps,
    RunTestProps,
    TestRunType, CustomModel,
    GenerationReporter, JSONReporter
} from "okareo-ts-sdk";
import OpenAI from 'openai';
import { CHECK_TYPE, register_checks } from './utils/check_utils';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const PROJECT_NAME = "Global";
const MODEL_NAME = "Custom Meeting Summarizer";

const NUMBER_OF_WORDS = 50 - Math.round(Math.random() * 10);

const USER_PROMPT_TEMPLATE = "{scenario_input}";
const CLASSIFICATION_CONTEXT_TEMPLATE_PREAMBLE: string = "";
const SYSTEM_MEETING_SUMMARIZER_TEMPLATE: string = `
${CLASSIFICATION_CONTEXT_TEMPLATE_PREAMBLE}
You are a City Manager with significant AI/LLM skills. You are tasked with summarizing the key points from a meeting and responding in a structured manner.
You have a strong understanding of the meeting's context and the attendees. You are expected to provide a summary of the meeting in under ${NUMBER_OF_WORDS} words.
Your response MUST be in the following JSON format.  Content you add should not have special characters or line breaks.
{
    "actions": LIST_OF_TASKS_FROM_THE_MEETING,
    "short_summary": SUMMARY_OF_MEETING_IN_UNDER_${NUMBER_OF_WORDS}_WORDS,
    "attendee_list": LIST_OF_ATTENDEES
}
`;

const SUMMARY_LENGTH_CHECK = "Return the length of the short_summary property from the JSON model response.";
const SUMMARY_UNDER_256_CHECK = "Pass if the property short_summary from the JSON model result has less than 256 characters.";
const SUMMARY_IS_JSON = "Pass if the model result is JSON with the properties short_summary, actions, and attendee_list.";

const required_checks: CHECK_TYPE[] = [
  {
    name: "demo.Summary.Length",
    description: SUMMARY_LENGTH_CHECK,
    output_data_type: "int"
  },
  {
    name: "demo.Summary.Under256",
    description: SUMMARY_UNDER_256_CHECK,
    output_data_type: "bool"
  },
  {
    name:"demo.Summary.JSON",
    description: SUMMARY_IS_JSON,
    output_data_type: "bool"
  },
];


const report_definition = {
	metrics_min: {
		"consistency": 4.0,
		"relevance": 4.0,
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

    await register_checks(okareo, project_id, required_checks);

    const meeting_scenario: any = await okareo.upload_scenario_set({
        name: "Meeting Bank Small Data Set",
        file_path: "./.okareo/flows/meetings.jsonl",
        project_id: project_id,
    });

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY, // This is the default and can be omitted
    });
    
    const model = await okareo.register_model({
      name: MODEL_NAME,
      tags: ["Demo", "Summaries", `Build:${UNIQUE_BUILD_ID}`],
      project_id: project_id,
      models: {
          type: "custom",
          invoke: async (input: string) => { 
            try {
              const chatCompletion: any = await openai.chat.completions.create({
                  messages: [
                      { role: 'user', content:  input },
                      { role: 'system', content: SYSTEM_MEETING_SUMMARIZER_TEMPLATE },
                  ],
                  model: 'gpt-3.5-turbo',
                  temperature: 0.5,
              });
              const summary_result = chatCompletion.choices[0].message.content;
              
              return {
                  model_prediction: summary_result,
                  model_input: input,
                  model_output_metadata: {
                    input: input,
                    method: "openai",
                    context: chatCompletion,
                  }
              }
            } catch (error) {
                console.error("openai error",error);
                return {
                    "actions": ["ERROR"],
                    "short_summary": "ERROR",
                    "attendee_list": ["ERROR"],
                }
            }
          }
      } as CustomModel,
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
        ...required_checks.map(c => c.name),
      ]
    } as RunTestProps);
    const reporter_output = new JSONReporter({
        eval_runs:[ eval_run ]
    });
    reporter_output.log();

    /*
		const reporter = new GenerationReporter({
        eval_run :eval_run, 
        ...report_definition,
    });
    reporter.log();
    
    if (!reporter.pass) {
      // intentionally not blocking the build.
      console.log("The model did not pass the evaluation. Please review the results.");
      //throw new Error("The model did not pass the evaluation. Please review the results.");
    }
    */
	} catch (error) {
    throw new Error(error);
	}
}
main();




