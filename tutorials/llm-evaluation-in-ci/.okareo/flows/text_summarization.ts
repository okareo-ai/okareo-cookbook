import { 
	Okareo, 
	RunTestProps, 
	components,
	SeedData,
    TestRunType, 
    OpenAIModel,
    GenerationReporter,
} from "okareo-ts-sdk";

import * as core from "@actions/core";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);

const PROJECT_NAME = "Global";
const MODEL_NAME = "Text Summarizer";
const SCENARIO_SET_NAME = "Webbizz Articles for Text Summarization";

const USER_PROMPT_TEMPLATE = "{scenario_input}"
const SUMMARIZATION_CONTEXT_TEMPLATE = "You will be provided with text. Summarize the text in 1 simple sentence."

const main = async () => {
	try {
		const okareo = new Okareo({api_key: OKAREO_API_KEY });
		const project: any[] = await okareo.getProjects();
		const project_id = project.find(p => p.name === PROJECT_NAME)?.id;

        // create scenario set
        const TEST_SEED_DATA = [
		    SeedData({
		        input:"WebBizz is dedicated to providing our customers with a seamless online shopping experience. Our platform is designed with user-friendly interfaces to help you browse and select the best products suitable for your needs. We offer a wide range of products from top brands and new entrants, ensuring diversity and quality in our offerings. Our 24/7 customer support is ready to assist you with any queries, from product details, shipping timelines, to payment methods. We also have a dedicated FAQ section addressing common concerns. Always ensure you are logged in to enjoy personalized product recommendations and faster checkout processes.",  
		        result:"75eaa363-dfcc-499f-b2af-1407b43cb133"
		    }),
		    SeedData({
		        input:"Safety and security of your data is our top priority at WebBizz. Our platform employs state-of-the-art encryption methods ensuring your personal and financial information remains confidential. Our two-factor authentication at checkout provides an added layer of security. We understand the importance of timely deliveries, hence we've partnered with reliable logistics partners ensuring your products reach you in pristine condition. In case of any delays or issues, our tracking tool can provide real-time updates on your product's location. We believe in transparency and guarantee no hidden fees or charges during your purchase journey.",  
		        result:"ac0d464c-f673-44b8-8195-60c965e47525"
		    }),
		    SeedData({
		        input:"WebBizz places immense value on its dedicated clientele, recognizing their loyalty through the exclusive 'Premium Club' membership. This special program is designed to enrich the shopping experience, providing a suite of benefits tailored to our valued members. Among the advantages, members enjoy complimentary shipping, granting them a seamless and cost-effective way to receive their purchases. Additionally, the 'Premium Club' offers early access to sales, allowing members to avail themselves of promotional offers before they are opened to the general public.", 
		        result:"aacf7a34-9d3a-4e2a-9a5c-91f2a0e8a12d"
		    })
		];

        const scenario: any = await okareo.create_scenario_set(
            {
            	name: `${SCENARIO_SET_NAME} Scenario Set - ${UNIQUE_BUILD_ID}`,
            	project_id: project_id,
	            seed_data: TEST_SEED_DATA
            }
        );

        //or, upload scenario set from file
        // const webbizz_articles_absolute_path = "./.okareo/flows/webbizz_3_articles.jsonl";
		// const scenario: any = await okareo.upload_scenario_set({
		// 	name: "Webbizz Articles Scenario",
		// 	file_path: webbizz_articles_absolute_path,
		// 	project_id: project_id,
		// });

	    const model = await okareo.register_model({
			name: MODEL_NAME,
			tags: [`Build:${UNIQUE_BUILD_ID}`],
			project_id: project_id,
			models: {
				type: "openai",
				model_id:"gpt-3.5-turbo",
				temperature:0.5,
				system_prompt_template:SUMMARIZATION_CONTEXT_TEMPLATE,
				user_prompt_template:USER_PROMPT_TEMPLATE,
			} as OpenAIModel,
			update: true,
		});

        // run LLM evlauation
		const eval_run: components["schemas"]["TestRunItem"] = await model.run_test({
			model_api_key: OPENAI_API_KEY,
			name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
			tags: [`Build:${UNIQUE_BUILD_ID}`],
			project_id: project_id,
			scenario: scenario,
			calculate_metrics: true,
			type: TestRunType.NL_GENERATION,
			checks: [
				"coherence_summary",
				"consistency_summary",
				"fluency_summary",
				"relevance_summary"
			]
		} as RunTestProps);


		// reporting
		const report_definition = {
			metrics_min: {
				"coherence": 4.0,
				"consistency": 4.0,
				"fluency": 4.0,
				"relevance": 4.0,
			}
		};

		const reporter = new GenerationReporter({
				eval_run :eval_run, 
				...report_definition,
		});
		reporter.log();
		
		if (!reporter.pass) {
			core.setFailed("CI failed because the Okareo reporter failed.");
		}
	} catch (error) {
		core.setFailed("CI failed because: " + error.message);
	}
}
main();