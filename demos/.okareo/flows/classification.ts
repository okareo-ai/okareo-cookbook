import { 
    Okareo, 
    RunTestProps,
    TestRunType, CustomModel, OpenAIModel,
    classification_reporter,
} from "okareo-ts-sdk";

import OpenAI from 'openai';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const PROJECT_NAME = "Global";
const MODEL_NAME = "Question Classifier";


const NUMBER_OF_WORDS = 50 - Math.round(Math.random() * 10);

const USER_PROMPT_TEMPLATE = `{input}`
const CLASSIFICATION_SYSTEM_TEMPLATE: string = `
You will be provided a question from a customer about a product that tests AI models called Okareo.
Classify the question into a category from the list below.
Respond with only the category name from the list.
Use the examples next to the items to match the question to the category

Category:
    Getting Started - How do I get started with Okareo?
    Guides - How do I test a model classifier using Okareo?
    CLI & SDK - What is the API?
    Concepts - What is scenario?
    API Reference - Do you have a REST API?
    Using Okareo - How do I use Okareo?
    Integration Examples - Which model providers do you integrate with?
    Evaluation Metrics - What types of metrics are there?
    Model Management - How do I keep track of my models?
    Synthetic Data Generation - Can I generate more data for testing?
`;

const report_definition = {
    error_max: 8, 
    metrics_min: {
        precision: 0.7,
        recall: 0.8,
        f1: 0.7,
        accuracy: 0.8
    }
}

const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY, // This is the default and can be omitted
        });

        const questions_scenario: any = await okareo.upload_scenario_set({
            name: "Okareo SDK Questions",
            file_path: "./.okareo/flows/questions.jsonl",
            project_id: project_id,
        });

        const model = await okareo.register_model({
            name: MODEL_NAME,
            tags: ["Demo", "Summaries", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            models: {
                type: "custom",
                invoke: async (input: string, result: string) => { 
                    try {
                        const chatCompletion: any = await openai.chat.completions.create({
                            messages: [
                                { role: 'user', content:  USER_PROMPT_TEMPLATE },
                                { role: 'system', content: CLASSIFICATION_SYSTEM_TEMPLATE },
                            ],
                            model: 'gpt-3.5-turbo',
                            temperature: 0.5,
                        });
                        const class_result = chatCompletion.choices[0].message.content;
                        return [
                            class_result,
                            {
                                input: input,
                                method: "openai",
                                context: {
                                    input: input,
                                    result: result,
                                },
                            } 
                        ]
                    } catch (error) {
                        console.error("openai error",error);
                        return [
                            "ERROR",
                            {
                                input: input,
                                method: "openai",
                                context: {
                                    input: input,
                                    result: result,
                                },
                            } 
                        ]
                    }
                }
            } as CustomModel,
            update: true,
        });

        const classification_run: any = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
            tags: ["Demo", "Classification", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            scenario: questions_scenario,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
          } as RunTestProps);
          
          const report = classification_reporter(
              {
                  eval_run:classification_run, 
                  ...report_definition
              }
          );
          
          console.log(`\nEval: ${classification_run.name} - ${(report.pass)?"Pass 🟢" : "Fail 🔴"}`);
          Object.keys(report.fail_metrics).map(m => {
            const fMetrics: any = report.fail_metrics;
            if (Object.keys(fMetrics[m]).length > 0) {
              console.log(`\nFailures for ${m}`);
              console.table(fMetrics[m]);
            };
          });
          console.log(classification_run.app_link);
          
          if (!report.pass) {
            console.log(JSON.stringify(report, null, 2));
            //throw new Error("The model did not pass the evaluation. Please review the results.");
          }

	} catch (error) {
        throw new Error(error);
	}
}
main();




