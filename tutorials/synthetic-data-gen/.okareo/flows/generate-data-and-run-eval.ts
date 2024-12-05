import { 
	Okareo, 
	RunTestProps, 
	components,
	SeedData,
    TestRunType, 
    OpenAIModel,
    GenerationReporter,
    ScenarioType,
} from "okareo-ts-sdk";


const OKAREO_API_KEY = process.env.OKAREO_API_KEY;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);

const PROJECT_NAME = "Global";
const MODEL_NAME = "Product recommender";
const SCENARIO_SET_NAME = "Seed Scenarios for Product recommendation system";

const USER_PROMPT_TEMPLATE = "{scenario_input}"
const RECOMMENDATION_CONTEXT_TEMPLATE = "You are an intelligent product recommendation assistant. Your job is to recommend products based on user queries. The user will describe their needs or preferences, and you will suggest 1-3 suitable products. Each recommendation should include the product name, a brief description, key features that match the query, and the price (if provided or relevant). If no exact match is available, suggest the closest alternatives that fulfill most of the user's requirements."

const main = async () => {
	try {
	const okareo = new Okareo({api_key: OKAREO_API_KEY });
	const project: any[] = await okareo.getProjects();
	const project_id = project.find(p => p.name === PROJECT_NAME)?.id;

	// 1. create initial set of seed scenarios (you can also upload this data from a file using upload_scenario_set)
	const INITIAL_SEED_DATA = [
	    SeedData({
	        input:"I want a waterproof smartwatch with GPS for running, under $250",  
	        result:"The Garmin Forerunner 45 ($180) is a great option, offering GPS tracking, waterproofing, and running-specific features. Alternatively, the Amazfit Bip U Pro ($69) provides similar functionality at a lower price."
	    }),
	    SeedData({
	        input:"I need noise-canceling headphones for under $150",  
	        result:"The Sony WH-CH710N ($130) offers effective noise cancellation, up to 35 hours of battery life, and a comfortable design. For a more compact option, consider the Anker Soundcore Life Q30 ($79) with hybrid noise cancellation."
	    }),
	    SeedData({
	        input:"I’m looking for an eco-friendly yoga mat that’s not too expensive.", 
	        result:"The Gaiam Cork Yoga Mat ($49) is a sustainable option made with cork and TPE. Another great choice is the Liforme Travel Mat ($120), which uses biodegradable materials and offers excellent grip."
	    }),
	    SeedData({
	        input:"What’s a good beginner’s acoustic guitar for under $200?",
	        result:"The Yamaha FG800 ($199) is a highly recommended beginner guitar with excellent tone and durability. If you’re looking for something smaller, the Fender FA-15 ($149) is a great option."
	    })
	];

	const seed_scenario: any = await okareo.create_scenario_set(
	    {
	    	name: `${SCENARIO_SET_NAME} Scenario Set - ${UNIQUE_BUILD_ID}`,
	    	project_id: project_id,
	        seed_data: INITIAL_SEED_DATA
	    }
	);

	// 2. Generate synthetic data scenarios from the seed scenarios
	const misspelled_scenario: any = await okareo.generate_scenario_set(
	    {
	        project_id: project_id,
	        name: `${SCENARIO_SET_NAME} Misspelled Scenario Set - ${UNIQUE_BUILD_ID}`,
	        source_scenario_id: seed_scenario.scenario_id,
	        number_examples: 5,
	        generation_type: ScenarioType.COMMON_MISSPELLINGS,
	    }
	)


	// 3. Register your LLM with Okareo
	const model = await okareo.register_model({
		name: MODEL_NAME,
		tags: [`Build:${UNIQUE_BUILD_ID}`],
		project_id: project_id,
		models: {
			type: "openai",
			model_id:"gpt-3.5-turbo",
			temperature:0.5,
			system_prompt_template:RECOMMENDATION_CONTEXT_TEMPLATE,
			user_prompt_template:USER_PROMPT_TEMPLATE,
		} as OpenAIModel,
		update: true,
	});

	// 4. run LLM evaluation
	const eval_run: components["schemas"]["TestRunItem"] = await model.run_test({
		model_api_key: OPENAI_API_KEY,
		name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
		tags: [`Build:${UNIQUE_BUILD_ID}`],
		project_id: project_id,
		scenario: misspelled_scenario,
		calculate_metrics: true,
		type: TestRunType.NL_GENERATION,
		checks: [
			"coherence",
			"consistency",
			"fluency",
			"relevance"
		]
	} as RunTestProps);


	// 5. reporting
	const report_definition = {
		metrics_min: {
			"coherence": 4.8,
			"consistency": 4.8,
			"fluency": 4.8,
			"relevance": 4.8,
		}
	};

	const reporter = new GenerationReporter({
			eval_run :eval_run, 
			...report_definition,
	});
	reporter.log();
		
	} catch (error) {
		console.log("Okareo flow script failed because: " + error.message);
	}
}
main();