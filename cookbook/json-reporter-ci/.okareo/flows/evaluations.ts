import { 
    Okareo, 
    RunTestProps, components,
    TestRunType, OpenAIModel,
    JSONReporter,
	CustomModel,
	ModelInvocation 
} from "okareo-ts-sdk";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const PROJECT_NAME = "Global";

const TEST_SEED_DATA = [
    {
        "input": "Can I connect to my SalesForce?",
        "result": "Technical Support"
    },
    {
        "input": "Do you have a way to send marketing emails?",
        "result": "Technical Support"
    },
    {
        "input": "Can I get invoiced instead of using a credit card?",
        "result": "Billing"
    },
    {
        "input": "My CRM integration is not working.",
        "result": "Technical Support"
    },
    {
        "input": "Do you have SOC II type 2 certification?",
        "result": "Account Management"
    },
    {
        "input": "I like the product. Please connect me to your enterprise team.",
        "result": "General Inquiry"
    }
];

const TEST_IR_DATA = [
    {
        "input": "What are top WebBizz Rewards loyalty programs?",
        "result": ["Spring Saver", "Free Shipping", "Birthday Gift"]
    },
    {
        "input": "What are WebBizz most popular collections?",
        "result": ["Super Sunday", "Top 10", "New Arrivals"]
    },
    {
        "input": "Which are biggest savings months for WebBizz?",
        "result": ["January", "July"]
    }
];



const USER_PROMPT_TEMPLATE = `{input}`

const CLASSIFICATION_CONTEXT_TEMPLATE = `
You will be provided a question from a customer.
Classify the question into a customer category and sub-category.
Provide the output with only the category name.

Categories: Technical Support, Billing, Account Management, General Inquiry, Unknown

Sub-Categories for Technical Support:
Troubleshooting
Product features
Product updates
Integration options
Found a problem

Sub-Categories for Billing:
Unsubscribe
Upgrade
Explain my bill
Change payment
Dispute a charge

Sub-Categories for Account Management:
Add a team member
Change or Update details
Password reset
Close account
Security

Sub-Categories for General Inquiry:
Contact sales
Product information
Pricing
Feedback
Speak to a human
`;

const JSON_DAILOG_INLINE = [
    {
        "input": [
            { "role": "system", "content": "You are super genious mind reader!" },
            {
                "role": "user",
                "content": (
                    "I want to know the temperature in location i'm thinking of ... "
                    + "figure out the location and temperature!"
                ),
            },
            { "role": "assistant", "content": "I can help you with that!" },
            {
                "role": "function",
                "name": "get_temp",
                "content": "Error from server (NotFound)",
            },
        ],
        "result": { "role": "assistant", "content": "Oops!" },
    }
];


const main = async () => {
	try {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
		const pData: any[] = await okareo.getProjects();
		const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

		// CLASSIFICATION
        const classification_scenario: any = await okareo.create_scenario_set(
            {
                name: `CI: Reporter Example Class ${UNIQUE_BUILD_ID}`,
                project_id: project_id,
                seed_data: TEST_SEED_DATA
            }
        );
        
        const classification_model = await okareo.register_model({
            name: `CI: Reporter Example Classification ${UNIQUE_BUILD_ID}`,
            project_id: project_id,
            models: {
                type: "openai",
                model_id:"gpt-3.5-turbo",
                temperature:0.5,
                system_prompt_template:CLASSIFICATION_CONTEXT_TEMPLATE,
                user_prompt_template:USER_PROMPT_TEMPLATE
            } as OpenAIModel,
            update: true,
        });
        
        const classification_result: any = await classification_model.run_test({
            model_api_key: OPENAI_API_KEY,
            name: `CI: Reporter Example Run ${UNIQUE_BUILD_ID}`,
            project_id: project_id,
            scenario_id: classification_scenario.scenario_id,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        });

		// RETRIEVAL
		const retrieval_scenario: any = await okareo.create_scenario_set({
            name: "CI Custom Retrieval Model Test Data",
            project_id: project_id,
            seed_data: TEST_IR_DATA
        });

        const model = await okareo.register_model({
            name: "CI Custom Retrieval Model",
            project_id: project_id,
            models: {
                type: "custom",
                invoke: (input: string, result: string) => {
                    const articleIds = ["Spring Saver", "Free Shipping", "Birthday Gift", "Super Sunday", "Top 10", "New Arrivals", "January", "July"];
                    const scores = Array.from({length: 5}, () => ({
                        id: articleIds[Math.floor(Math.random() * articleIds.length)], // Select a random ID for each score
                        score: parseFloat(Math.random().toFixed(2)) // Generate a random score
                    })).sort((a, b) => b.score - a.score); // Sort based on the score
        
                    const parsedIdsWithScores = scores.map(({ id, score }) => [id, score])
                            
                    return {
                        model_prediction: parsedIdsWithScores,
                        model_input: input,
                        model_output_metadata: {
                            input: input,
                            result: result,
                        }
                    } as ModelInvocation
                }
            } as CustomModel,
            update: true,
        });
        
        
        const retrieval_result: any = await model.run_test({
            name: `CI: Reporter Example Run ${UNIQUE_BUILD_ID}`,
            project_id: project_id,
            scenario: retrieval_scenario,
            calculate_metrics: true,
            type: TestRunType.INFORMATION_RETRIEVAL,
        } as RunTestProps);

		// GENERATION
        const generation_scenario: any = await okareo.create_scenario_set(
            {
              name: `CI: Reporter Example Generation ${UNIQUE_BUILD_ID}`,
              project_id: project_id,
              seed_data: JSON_DAILOG_INLINE
            }
          );
      
		const generation_model = await okareo.register_model({
			name: `CI: Reporter Example Generation ${UNIQUE_BUILD_ID}`,
			project_id: project_id,
			models: [{
				type: "openai",
				model_id:"gpt-3.5-turbo",
				temperature:0.5,
				dialog_template: "{input}"
				} as OpenAIModel],
			update: true,
		});
              
		const generation_result: any = await generation_model.run_test({
			model_api_key: OPENAI_API_KEY,
			name: `CI: Reporter Example Run ${UNIQUE_BUILD_ID}`,
			project_id: project_id,
			scenario: generation_scenario,
			calculate_metrics: true,
			type: TestRunType.NL_GENERATION,
			checks: [
			"compression_ratio",
			"levenshtein_distance"
			],
		} as RunTestProps);

		const reporter = new JSONReporter({
			eval_runs:[
				classification_result as components["schemas"]["TestRunItem"],
				retrieval_result as components["schemas"]["TestRunItem"],
				generation_result as components["schemas"]["TestRunItem"],
			]
			});
			reporter.log();

	} catch (error) {
		console.error(error);
	}

}
main();




