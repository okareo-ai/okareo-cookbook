import { 
    CustomModel,
    GenerationReporter,
    Okareo,  
    RunTestProps,
    ScenarioType,
    TestRunType,
} from "okareo-ts-sdk";
import * as fs from 'fs';
import { invoke } from "./openai-assistant-model";

// keys for the evaluation
const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// unique identifier for the evaluation
const UNIQUE_BUILD_ID = (process.env.DEMO_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);
const PROJECT_NAME = "Global";

// name for the Okareo CustomModel0
const MODEL_NAME = "WebBizz B2B Analyst (OpenAI Assistant)";

export async function runEvaluation(
    scenarioName: string,
    scenarioFilePath: string,
    evalName: string,
    checkName: string,
    reportDefinition: any,
) {
		const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        const project_id = pData.find(p => p.name === PROJECT_NAME)?.id;

        const scenario: any = await okareo.upload_scenario_set({
            name: scenarioName,
            file_path: scenarioFilePath,
            project_id: project_id,
        });

        const model_under_test = await okareo.register_model({
            name: MODEL_NAME,
            project_id: project_id,
            models: {
                type: "custom",
                invoke,
            } as CustomModel
        });

        const uniqueEvalName = `${evalName} - ${UNIQUE_BUILD_ID}`;
        const eval_run: any = await model_under_test.run_test({
            name: uniqueEvalName,
            tags: [`BUILD_ID:${UNIQUE_BUILD_ID}`],
            model_api_key: OPENAI_API_KEY,
            project_id: project_id,
            scenario_id: scenario.scenario_id,
            type: TestRunType.NL_GENERATION,
            checks: [checkName],
        } as RunTestProps );

		const reporter = new GenerationReporter({
            eval_run: eval_run, 
            ...reportDefinition,
        });
        reporter.log();
}
