import { 
    Okareo, 
    RunTestProps,
    classification_reporter,
    ModelUnderTest, OpenAIModel, SeedData, ScenarioType, TestRunType, CustomModel
} from 'okareo-ts-sdk';
import OpenAI from 'openai';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID = (process.env.SDK_BUILD_ID || `local.${(Math.random() + 1).toString(36).substring(7)}`);

const CLASSIFICATION_CONTEXT_TEMPLATE_PREAMBLE: string = "";

const SYSTEM_MEETING_SUMMARIZER_TEMPLATE: string = `
${CLASSIFICATION_CONTEXT_TEMPLATE_PREAMBLE}
Your response MUST be in the following JSON format.  Content you add should not have special characters or line breaks.
{
    "actions": LIST_OF_TASKS_FROM_THE_MEETING,
    "short_summary": SUMMARY_OF_MEETING_IN_UNDER_100_WORDS,
    "attendee_list": LIST_OF_ATTENDEES
}
`;


let project_id: string;

describe('Evaluations', () => {
    beforeAll(async () => {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const pData: any[] = await okareo.getProjects();
        project_id = pData.find(p => p.name === "Global")?.id;
    });

    test('Summarizer', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY });
        const root_name = `Meeting Summaries ${UNIQUE_BUILD_ID}`

        const meeting_scenario: any = await okareo.upload_scenario_set({
            scenario_name: "Meeting Bank Small",
            file_path: "./test-ci/meetings.jsonl",
            project_id: project_id
        });

        const openai = new OpenAI({
            apiKey: OPENAI_API_KEY, // This is the default and can be omitted
        });
        const model = await okareo.register_model({
            name: "Meeting Summarizer",
            tags: ["Demo", "Summaries"],
            project_id: project_id,
            models: {
                type: "custom",
                invoke: async (input: string, expected: string) => { 
                    const chatCompletion: any = await openai.chat.completions.create({
                        messages: [
                            { role: 'user', content:  input },
                            { role: 'system', content: SYSTEM_MEETING_SUMMARIZER_TEMPLATE },
                        ],
                        model: 'gpt-3.5-turbo',
                    });
                    try {
                        const summary_result = chatCompletion.choices[0].message.content;
                        return {
                            model_prediction: summary_result,
                            model_output_metadata: {
                                input: input,
                                method: "openai",
                                context: {
                                    
                                },
                            }
                        }
                    } catch (error) {
                        console.log(error);
                        return {
                            "actions": ["ERROR"],
                            "short_summary": "ERROR",
                            "attendee_list": ["ERROR"],
                        }
                    }
                }
            } as CustomModel,
            update: true,
        });
        
        const test_results: any = await model.run_test({
          model_api_key: OPENAI_API_KEY,
          name: `CI: Custom Test Run ${UNIQUE_BUILD_ID}`,
          tags: ["TS-SDK", "CI", "Testing", `Build:${UNIQUE_BUILD_ID}`],
          project_id: project_id,
          scenario: meeting_scenario,
          calculate_metrics: true,
          type: TestRunType.NL_GENERATION,
          checks: [
            "demo.summarylength",
            "demo.issummaryunder256",
            "demo.isjson.playground",
            "consistency_summary",
            "relevance_summary"
          ],
        } as RunTestProps);
        
        expect(test_results).toBeDefined();
    });


});




