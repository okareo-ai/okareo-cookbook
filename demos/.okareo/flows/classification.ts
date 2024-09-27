import { 
    Okareo, 
    RunTestProps, components,
    TestRunType, CustomModel, OpenAIModel,
    ClassificationReporter,
    ModelInvocation,
    JSONReporter
} from "okareo-ts-sdk";
import * as core from '@actions/core';

import OpenAI from 'openai';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const PROJECT_NAME = "Global";
const MODEL_NAME = "Question Classifier";

const USER_PROMPT_TEMPLATE = `{scenario_input}`
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

const CLASSIFICATION_SYSTEM_TEMPLATE_mid: string = `
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

const CLASSIFICATION_SYSTEM_TEMPLATE: string = `
You will be provided a question from a customer about a developer product called Okareo.
Okareo provides developers tool to evaluate software that uses AI. The Okareo system has a number of capabilities including:
- Synthetic Data to create test scenearios
- Model Registry for managing models that are being tested or traced in production
- A metric evaluation mechanism called Checks that provide measures of quality
- An Evaluation harness to test models in
- A rich API, Python SDK, TypeScript SDK, and CLI
- Okareo supports AI architectures such as Agent, RAG, Summarization, Classification, Retrieval, and more.

As a Technical Writer, classify the questions into a category from the json structure below.
Respond with only the category name from the question_categories structure. ALWAYS select the most specific category. Try to avoid general categories.
{
    question_categories: [
        {
            "category": "Getting Started"
            "description": "A short documents that provides a high level overview of the Okareo product."
        },{
            "category": "Guides"
            "description": "A series of short documents that walk through first-time use of Okareo for Classification, Retrieval, and Generation."
        },{
            "category": "Synthetic Data Generation"
            "description": "A broad and rich set of mechanisms to create synthetic data for testing models.  The synthetic data generators can perumate data in a variety of ways. This includes rewriting, substitution, tone changes, negation, and more.  The purpose of scenarios is to find and define the edges of model success."
        },{
            "category": "Evaluation Metrics"
            "description": "There are a number of metrics that are used to evaluate the quality of a model.  These metrics include precision, recall, f1, accuracy, MRR, NDCG, MAP, Levenshtein Distance and more. You can also create your own metrics that quanitify any aspect of the model output or performance."
        },{
            "category": "CLI & SDK"
            "description": "The Okareo product incldues a CLI for running scripts locally or in CI.  It also incldues SDKs for Python and Typescript. These SDKs allow developers to use their preferred test framework or even include Okareo in their core application."
        },{
            "category": "API Reference"
            "description": "Everything Okareo has built is accessible through standard RESTful API.  The API is documented in Swagger and OpenAPI.  The API is used to create scenarios, run tests, and manage models."
        },{
            "category": "Integration Examples"
            "description": "To make it easier for Developer's to adopt Okareo, we have integrated with a number of popular model providers.  These providers include OpenAI, Cohere, Pinecone, QDrant, ChromaDB, and more."
        },{    
            "category": "Model Management"
            "description": "To use a broad range of models, it is important to keep track of the models that are being used.  Okareo provides a model registry that allows you to register models, update models, and track the performance of models over time."
        },{
            "category": "Concepts"
            "description": "This is a general area that has a variety of documents explaining basic concepts.  This is a catch-all category for questions that do not fit into the other categories."
        }
    ]
}
`;
//

const report_definition = {
    error_max: 8, 
    metrics_min: {
        precision: 0.5,
        recall: 0.5,
        f1: 0.5,
        accuracy: 0.5,
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
        const questions_scenario: any = await okareo.upload_scenario_set({
            name: "Okareo Questions - Short",
            file_path: "./.okareo/flows/questions_short.jsonl",
            project_id: project_id,
        });
        */

        // This model approach can be used but does not provide the same level of control as the custom model
        /*
        const model = await okareo.register_model({
            name: MODEL_NAME,
            tags: ["Demo", "Classification", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            models: {
                type: "openai",
                model_id:"gpt-3.5-turbo",
                temperature:0.5,
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
                invoke: async (input: string) =>  { 
                    try {
                        const chatCompletion: any = await openai.chat.completions.create({
                            messages: [
                                { role: 'user', content:  input },
                                { role: 'system', content: CLASSIFICATION_SYSTEM_TEMPLATE },
                            ],
                            model: 'gpt-3.5-turbo',
                            temperature: 0.1,
                        });
                        const class_result = chatCompletion.choices[0].message.content;
                        return  {
                            model_prediction: class_result,
                            model_input: input,
                            model_output_metadata: {
                                input: input,
                                method: "openai",
                                context: {
                                    input: input,
                                    model_prediction: class_result,
                                },
                            },
                        }
                    } catch (error) {
                        console.error("openai error",error);
                        return [
                            "ERROR",
                            {
                                input: input,
                                method: "openai",
                                context: {
                                    input: input,
                                },
                            } 
                        ]
                    }
                }
            } as CustomModel,
            update: true,
        });
        
        
        const classification_run: components["schemas"]["TestRunItem"] = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
            tags: ["Demo", "Classification", `Build:${UNIQUE_BUILD_ID}`],
            project_id: project_id,
            scenario: questions_scenario,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);
        
        const reporter = new ClassificationReporter({
            eval_run:classification_run, 
            ...report_definition,
        });
        reporter.log();

        const reporter_output = new JSONReporter({
            eval_runs:[ classification_run ]
        });
        reporter_output.log();

        if (!reporter.pass) {
            // intentionally not blocking the build.
            console.log("The model did not pass the evaluation. Please review the results.");
            //throw new Error("The model did not pass the evaluation. Please review the results.");
        }

	} catch (error) {
        // intentionally not blocking the build.
		core.setFailed("Failed: "+error);
	}
}
main();




