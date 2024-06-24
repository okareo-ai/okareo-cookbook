import { 
    Okareo, 
    RunTestProps,
    classification_reporter,
    OpenAIModel, SeedData, TestRunType, CustomModel
} from 'okareo-ts-sdk';


const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "<YOUR_OPENAI_KEY>";

const TEST_SEED_DATA = [
    SeedData({
        input:"Can I connect to my SalesForce?",  
        result:"Technical Support"
    }),
    SeedData({
        input:"Do you have a way to send marketing emails?",  
        result:"Technical Support"
    }),
    SeedData({
        input:"Can I get invoiced instead of using a credit card?", 
        result:"Billing"
    }),
    SeedData({
        input:"My CRM integration is not working.", 
        result:"Technical Support"
    }),
    SeedData({
        input:"Do you have SOC II tpye 2 certification?", 
        result:"Account Management"
    }),
    SeedData({
        input:"I like the product.  Please connect me to your enterprise team.", 
        result:"General Inquiry"
    })
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


let project_id: string;

describe('Evaluations', () => {
    beforeAll(async () => {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        project_id = pData.find(p => p.name === "Global")?.id;
    });
    

    test('E2E OpenAI Classification', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const sData: any = await okareo.create_scenario_set(
            {
                name: "Demo SEED Classification Data",
                project_id: project_id,
                seed_data: TEST_SEED_DATA
            }
        );
        
        const model = await okareo.register_model({
            name: "Demo Classification Model",
            tags: ["Demo", "Testing"],
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
        
        const data: any = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            project_id: project_id,
            scenario_id: sData.scenario_id,
            name: "Demo LLM Classification",
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);
        
        const report = classification_reporter(
            {
                eval_run:data, 
                error_max: 6, 
                metrics_min: {
                    precision: 0.1,
                    recall: 0.1,
                    f1: 0.1,
                    accuracy: 0.1
                }
            }
        );
        if (!report.pass) {
            console.log(report);
        }
        expect(report.pass).toBeTruthy();
    });

    test('E2E Custom Model', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const sData: any = await okareo.create_scenario_set(
            {
            name: "Demo Testing Scenario Set",
            project_id: project_id,
            seed_data: TEST_SEED_DATA
            }
        );
        
        const model = await okareo.register_model({
            name: "Demo Custom Model",
            tags: ["Demo", "Custom", "Testing"],
            project_id: project_id,
            models: {
                type: "custom",
                invoke: (input: string) => { 
                    return {
                        model_prediction: "Technical Support",
                        model_output_metadata: {
                            input: input,
                            method: "hard coded",
                            context: "TS SDK Test Response",
                        }
                    }
                }
            } as CustomModel,
        });

        const data: any = await model.run_test({
            model_api_key: OPENAI_API_KEY,
            project_id: project_id,
            scenario_id: sData.scenario_id,
            name: "Demo Custom Run",
            calculate_metrics: true,
            type: TestRunType.MULTI_CLASS_CLASSIFICATION,
        } as RunTestProps);
        
        const report = classification_reporter(
            {
                eval_run:data, 
                error_max: 6, 
                metrics_min: {
                    precision: 0.5,
                    recall: 0.5,
                    f1: 0.5,
                    accuracy: 0.5
                }
            }
        );
        if (!report.pass) {
            console.log(report);
        }
        expect(report.errors).toBeGreaterThanOrEqual(1);

    });

});




