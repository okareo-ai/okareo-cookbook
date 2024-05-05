import { 
    Okareo, 
    UploadEvaluatorProps,
    RunTestProps,
    TestRunType, CustomModel,
    generation_reporter,
} from "okareo-ts-sdk";

import OpenAI from 'openai';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const PROJECT_NAME = "Global";
const MODEL_NAME = "Meeting Summarizer";

const CLASSIFICATION_CONTEXT_TEMPLATE_PREAMBLE: string = "";

const NUMBER_OF_WORDS = 50 - Math.round(Math.random() * 10);
const SYSTEM_MEETING_SUMMARIZER_TEMPLATE: string = `
${CLASSIFICATION_CONTEXT_TEMPLATE_PREAMBLE}
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
//const SUMMARY_WORD_COUNT = "Count the number of words in the short_summary property from the JSON response.";

type CHECK_TYPE = {
  name: string;
  description: string;
  output_data_type: string;
  update?: boolean;
}

const addCheck = async (okareo: Okareo, project_id: string, check: CHECK_TYPE) => {
  const check_primitive = await okareo.generate_check({  
    project_id,
    ...check
  });
  if (check_primitive.generated_code && check_primitive.generated_code.length > 0) {
    return await okareo.upload_check({
        project_id,
        ...check_primitive,
        update: true,
    } as UploadEvaluatorProps);
  }
  throw new Error(`${check.name}: Failed to generate a check.`);
}

const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

    const checks = await okareo.get_all_checks();
    
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
      /*
      {
        name: "demo.Summary.WordCount",
        description: SUMMARY_WORD_COUNT,
        output_data_type: "int",
        update: true,
      },
      */
      {
        name:"demo.Summary.JSON",
        description: SUMMARY_IS_JSON,
        output_data_type: "bool"
      }
    ];

    for (const demo_check of required_checks) {
      const isReg: boolean = (checks.filter((c) => c.name === demo_check.name).length > 0);
      if (!isReg || demo_check.update === true) {
        const new_check = await addCheck(okareo, project_id, demo_check);
        console.log(`Check ${demo_check.name} has been created and is now available.`);
      } else {
        console.log(`Check ${demo_check.name} is available. No need to add it again`);
      }
    }

    const root_name = `Meeting Summaries ${UNIQUE_BUILD_ID}`

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
          invoke: async (input: string, expected: string) => { 
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
                  actual: summary_result,
                  model_response: {
                      input: input,
                      method: "openai",
                      context: {
                          
                      },
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
      name: `Demo: Meeting Eval ${UNIQUE_BUILD_ID}`,
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
    
    const report = generation_reporter(
        {
            eval_run:eval_run, 
            metrics_min: {
                "consistency_summary": 4.5,
                "relevance_summary": 4.5,
                //"demo.Summary.WordCount": 25,
            }, 
            metrics_max: {
                "demo.Summary.Length": 256,
            }, 
            pass_rate: {
                "demo.Summary.Under256": 1,
                "demo.Summary.JSON": 1,
            }
        }
    );
    
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




