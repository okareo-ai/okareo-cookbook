import { Okareo, RunTestProps, TestRunType, CustomModel, ClassificationReporter } from "okareo-ts-sdk";

const main = async () => {
    try {
        const okareo = new Okareo({api_key:process.env.OKAREO_API_KEY});
        const project_id = (await okareo.getProjects()).find(p => p.name === 'Global')?.id;

        const scenario: any = await okareo.create_scenario_set({
            name: 'Minimal Example Scenario',
            project_id: project_id,
            seed_data: [
                { input: 'What is the capital of France?', result: 'Paris' },
                { input: 'What is the capital of Germany?', result: 'Berlin' },
                { input: 'What is the capital of Mars?', result: 'Desher' },
            ]
        });
        
        const model = await okareo.register_model({
            name: 'Static Response Model',
            project_id: project_id,
            models: {
                type: 'custom',
                invoke: async (input: string) =>  {
                    let model_result: string = 'Unknown'
                    if (input.includes('France')) {
                        model_result = 'Paris';
                    } else if (input.includes('Germany')) {
                        model_result = 'Berlin';
                    }
                    return  {
                        model_prediction: model_result,
                        model_input: input,
                        model_output_metadata: {
                            prediction: model_result,
                        }
                    }
                }
            } as CustomModel,
            update: true,
        });
        
        const eval_run: any = await model.run_test({
            name: 'First Evaluation',
            project_id: project_id,
            scenario_id: scenario.scenario_id,
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);
        const report_definition = {
            error_max: 1, 
            metrics_min: {
                precision: 0.5,
                recall: 0.5,
                f1: 0.5,
                accuracy: 0.5,
            }
        }

        const reporter = new ClassificationReporter({
            eval_run:eval_run, 
            ...report_definition,
        });
        reporter.log();
    } catch (e) {
        console.error(JSON.stringify(e, null, 2));  
    }
}
main();