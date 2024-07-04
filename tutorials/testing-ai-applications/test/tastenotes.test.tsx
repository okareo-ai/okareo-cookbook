import generate, { SYSTEM_PROMPT, user_prompt } from "../pages/api/generate";
import { Okareo, OpenAIModel } from "okareo-ts-sdk"

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

describe('Prompt concatenation function works', () => {
    it('Should return a prompt that includes our prompt template text', () => {
        let tasteNotes = "peach, jasmine";
        expect(user_prompt(tasteNotes)).toContain("I have brewed some coffee")
    })
})

describe('Prompt generates a reasonable answer', async () => {
    const main = async () => {
        try {
            const okareo = new Okareo({api_key:OKAREO_API_KEY });
    
            const sData: any = await okareo.create_scenario_set({
                name: "Detect Passive Intent",
                project_id: project_id,
                number_examples: 3,
                generation_type: ScenarioType.TEXT_REVERSE_QUESTION,
                seed_data: DIRECTED_INTENT
            });
            
            const model_under_test = await okareo.register_model({
                name: "GPT-4o with a coffee prompt v1",
                tags: ["TS-SDK", "Testing"],
                project_id: project_id,
                models: {
                    type: "openai",
                    model_id:"gpt-4o",
                    temperature:0.5,
                    system_prompt_template: SYSTEM_PROMPT,
                    user_prompt_template: user_prompt
                } as OpenAIModel
            });
    
            const eval_run: any = await model_under_test.run_test({
                name: "TS-SDK Classification",
                tags: ["Classification", "BUILD_ID"],
                model_api_key: OPENAI_API_KEY,
                project_id: project_id,
                scenario_id: sData.scenario_id,
                calculate_metrics: true,
                type: TestRunType.MULTI_CLASS_CLASSIFICATION,
            } as RunTestProps );
    
            const reporter = new ClassificationReporter({
                eval_run, 
                error_max: 2, // allows for up to 2 errors 
                metrics_min: {
                    precision: 0.95,
                    recall: 0.9,
                    f1: 0.9,
                    accuracy: 0.95
                },
            });
            reporter.log(); // logs a table to the console output with the report results
    
        } catch (error) {
            console.error(error);
        }
    }
    
const model_under_test = await okareo.register_model({
    name: "GPT-4o with a coffee prompt v1",
    tags: ["OpenAI", "Example"],
    project_id: project_id,
    models: {
        type: "openai",
        api_key: process.env.OPENAI_API_KEY,
        model_id:"gpt-4o",
        temperature:0.0,
        system_prompt_template: generate.SYSTEM_PROMPT,
        user_prompt_template: generate.user_prompt()
    } as OpenAIModel,
});