import {
    Okareo,
    OpenAIModel,
    TestRunType,
    MultiTurnDriver,
} from "okareo-ts-sdk";
import * as fs from 'fs';

// keys for the evaluation
const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const PROJECT_NAME = "Global";

async function main() {
    const okareo = new Okareo({ api_key: OKAREO_API_KEY });
    const pData: any[] = await okareo.getProjects();
    const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

    // get directives for the driver
    const DRIVER_DIRECTIVES = fs.readFileSync('src/directives/driver-prompt-off-topic-directives.txt', 'utf8');
    const TARGET_DIRECTIVES = fs.readFileSync('src/directives/target-directives.txt', 'utf8');
    const TARGET_CONTEXT = fs.readFileSync('src/directives/target-context.txt', 'utf8');

    const datum = {
        "input": DRIVER_DIRECTIVES,
        "result": "N/A",
    };
    const driver_data = [datum];

    const sData = await okareo.create_scenario_set(
        {
            name: "Cookbook MultiTurn Tutorial: Red-team Driver Off-Topic",
            seed_data: driver_data,
            project_id
        }
    );
    console.log(sData.app_link);

    const target_model = {
        type: "openai",
        model_id: "gpt-3.5-turbo",
        temperature: 1,
        system_prompt_template: TARGET_DIRECTIVES + "\n\n" + TARGET_CONTEXT,
    } as OpenAIModel

    const model = await okareo.register_model({
        name: "Cookbook OpenAI MultiTurnDriver",
        models: {
            type: "driver",
            driver_temperature: 1,
            max_turns: 5,
            repeats: 10,
            target: target_model,
        } as MultiTurnDriver,
        update: true,
        project_id,
    });

    const test_run = await model.run_test({
        model_api_key: { "openai": OPENAI_API_KEY },
        name: "Red-Teaming: Off-Topic Queries",
        scenario_id: sData.scenario_id,
        calculate_metrics: true,
        type: TestRunType.NL_GENERATION,
        checks: ["model_refusal"],
        project_id,
    });
    console.log(test_run.app_link);
};

main();