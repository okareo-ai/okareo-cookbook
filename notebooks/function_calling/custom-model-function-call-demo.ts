import { 
    Okareo, 
    RunTestProps,
    TestRunType, CustomModel,
    ClassificationReporter,
} from "okareo-ts-sdk";

const main = async () => {
    try {
        const okareo = new Okareo({api_key:process.env.OKAREO_API_KEY});
        const project_id = (await okareo.getProjects()).find(p => p.name === 'Global')?.id;

        function randomString(length: number): string {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
            let result = '';
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                result += characters[randomIndex];
            }
            return result;
        }

        const seedData = [
            {
                input: "can you delete my account? my name is Bob",
                result: {
                    name: "delete_account",
                    parameter_definitions: {
                        username: {
                            value: "Bob",
                            type: "str",
                            required: true
                        }
                    }
                }
            },
            {
                input: "how do I make an account? I'm Alice",
                result: {
                    name: "create_account",
                    parameter_definitions: {
                        username: {
                            value: "Alice",
                            type: "str",
                            required: true
                        }
                    }
                }
            },
            {
                input: "how do I create an account?",
                result: {
                    name: "create_account",
                    parameter_definitions: {
                        username: {
                            value: "Alice",
                            type: "str",
                            required: true
                        }
                    }
                }
            },
            {
                input: "my name is John. how do I create a project?",
                result: {
                    name: "create_account",
                    parameter_definitions: {
                        username: {
                            value: "Alice",
                            type: "str",
                            required: true
                        }
                    }
                }
            }
        ];

        const scenario: any = await okareo.create_scenario_set({
            name: `Function Call Demo Scenario - ${randomString(5)}`,
            project_id: project_id,
            seed_data: seedData
        });
        console.log(JSON.stringify(scenario, null, 2))

        const function_call_model = {
            type: 'custom',
            invoke: async (input_value) =>  {
                const usernames = ["Alice", "Bob", "Charlie"];
                const out: { tool_calls: { name: string; parameters: { [key: string]: any } }[] } = { tool_calls: [] };
                const tool_call: { name: string; parameters: { [key: string]: any } } = { name: "unknown", parameters: {} };
        
                // parse out the function name
                if (input_value.includes("delete")) {
                    tool_call.name = "delete_account";
                }
                if (input_value.includes("create")) {
                    tool_call.name = "create_account";
                }
        
                // parse out the function parameter
                for (const username of usernames) {
                    if (input_value.includes(username)) {
                        tool_call.parameters["username"] = username;
                        break;
                    }
                }
        
                // package the tool call and return
                out.tool_calls.push(tool_call);
                return {
                    model_prediction: out,
                    model_input: input_value,
                    model_output_metadata: {},
                };
            }
        } as CustomModel;
        
        const model = await okareo.register_model({
            name: 'Function Call Demo Model',
            project_id: project_id,
            models: function_call_model,
            update: true,
        });

        console.log("Model registered successfully");
        
        const eval_run: any = await model.run_test({
            name: 'Function Call Demo Evaluation',
            project_id: project_id,
            scenario_id: scenario.scenario_id,
            calculate_metrics: true,
            type: TestRunType.NL_GENERATION,
            checks: [
                "is_function_correct",
                "are_required_params_present",
                "are_all_params_expected",
                "do_param_values_match",
            ],
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




