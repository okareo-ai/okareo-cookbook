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

const USER_PROMPT_TEMPLATE = `{input}`
const CLASSIFICATION_SYSTEM_TEMPLATE_ORIG: string = `
You will be provided a question from a customer about a developer product called Okareo that evaluates AI models.
Classify the question into a category from the list below.
Respond with only the category name from the list.
Use the examples next to the items to match the question to the category

Category:
    Getting Started - How to use Okareo. How to setup Okareo.
    Synthetic Data Generation - How to setup synthetic data. How to use synthetic data.
    Guides - Three very basic documents that walk a user through the most cursory examples for classification, retrieval, and generation.
    CLI & SDK - Details about the Okareo API. How to use Python. How to use Trypescript. Specific details about the Okareo API.
    Integration Examples - Model providers that Okareo integrates with.
    Evaluation Metrics - How to interpret the results of a test. The specific metrics available.
    Model Management - Keeping track of models.  Registering models. Updating models.
`;

const CLASSIFICATION_SYSTEM_TEMPLATE: string = `
You will be provided a question from a customer about a developer product called Okareo.
Okareo provides developers tool to evaluate software that uses AI. The Okareo system has a number of capabilities including:
- Synthetic Data to create test scenearios
- Model Registry for managing models that are being tested or traced in production
- A metric evaluation mechanism called Checks that provide measures of quality
- An Evaluation harness to test models in
- A rich API, Python SDK, TypeScript SDK, and CLI
- Okareo supports AI architectures such as Agent, RAG, Summarization, Classification, Retrieval, and more.

As a Technical Writer, classify the questions into a category from the list below.
Respond with only the category name from the list. ALWAYS select the most specific category. Try to avoid general categories.

Category:
    Getting Started
    Guides
    Synthetic Data Generation
    Evaluation Metrics
    CLI & SDK
    API Reference
    Integration Examples
    Model Management
    Concepts
`;
//

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
            name: "Okareo Questions",
            file_path: "./.okareo/flows/questions.jsonl",
            project_id: project_id,
        });
        /*
        const model = await okareo.register_model({
            name: MODEL_NAME,
            tags: ["Demo", "Classification", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            models: {
                type: "openai",
                model_id:"gpt-3.5-turbo",
                temperature:0.2,
                system_prompt_template:CLASSIFICATION_SYSTEM_TEMPLATE,
                user_prompt_template:USER_PROMPT_TEMPLATE
            } as OpenAIModel,
            update: true,
        });
        */
        const model = await okareo.register_model({
            name: MODEL_NAME,
            tags: ["Demo", "Classification", `Build:${UNIQUE_BUILD_ID}`],
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
                            temperature: 0.2,
                        });
                        const class_result = chatCompletion.choices[0].message.content;
                        return [
                            class_result,
                            {
                                input: input,
                                method: "openai",
                                context: {
                                    input: input,
                                    actual: class_result,
                                    expected: result,
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
            console.log("The model did not pass the evaluation. Please review the results.");
            //throw new Error("The model did not pass the evaluation. Please review the results.");
          }

	} catch (error) {
        throw new Error(error);
	}
}
main();




