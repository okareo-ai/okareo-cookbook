import {
  Okareo,
  RunTestProps,
  components,
  SeedData,
  TestRunType,
  OpenAIModel,
  ClassificationReporter,
} from "okareo-ts-sdk";

import * as core from "@actions/core";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const UNIQUE_BUILD_ID =
  process.env.DEMO_BUILD_ID ||
  `local.${(Math.random() + 1).toString(36).substring(7)}`;

const PROJECT_NAME = "Global";
const MODEL_NAME = "Coffee Q grader";
const SCENARIO_SET_NAME = "Coffee flavor notes";

const USER_PROMPT_TEMPLATE = "{scenario_input}";
const SUMMARIZATION_CONTEXT_TEMPLATE =
  'You are a coffee Q grader with lots of experience in the speciality coffee field. Please respond with the most likely processing method used for this coffee. Be brief in the response, just mention the processing method name and no extra information. If multiple methods are likely, then mention the most likely options, but omit any extra information. The processing method should be succinct - avoid extraneous words like "processing" or "method" within this';

const main = async () => {
  try {
    const okareo = new Okareo({ api_key: OKAREO_API_KEY });
    const project: any[] = await okareo.getProjects();
    const project_id = project.find((p) => p.name === PROJECT_NAME)?.id;

    // create scenario set
    const TEST_SEED_DATA = [
      SeedData({
        input: "lemon zest",
        result: "Washed",
      }),
      SeedData({
        input: "Spicy, black pepper",
        result: "Natural",
      }),
      SeedData({
        input: "caramel",
        result: "Honey",
      }),
    ];

    const scenario: any = await okareo.create_scenario_set({
      name: `${SCENARIO_SET_NAME} Scenario Set - ${UNIQUE_BUILD_ID}`,
      project_id: project_id,
      seed_data: TEST_SEED_DATA,
    });

    const model = await okareo.register_model({
      name: MODEL_NAME,
      tags: [`Build:${UNIQUE_BUILD_ID}`],
      project_id: project_id,
      models: {
        type: "openai",
        model_id: "gpt-3.5-turbo",
        temperature: 0.1,
        system_prompt_template: SUMMARIZATION_CONTEXT_TEMPLATE,
        user_prompt_template: USER_PROMPT_TEMPLATE,
      } as OpenAIModel,
      update: true,
    });

    // run LLM evlauation
    const eval_run: components["schemas"]["TestRunItem"] = await model.run_test(
      {
        model_api_key: OPENAI_API_KEY,
        name: `${MODEL_NAME} Eval ${UNIQUE_BUILD_ID}`,
        tags: [`Build:${UNIQUE_BUILD_ID}`],
        project_id: project_id,
        scenario: scenario,
        calculate_metrics: true,
        type: TestRunType.MULTI_CLASS_CLASSIFICATION,
      } as RunTestProps
    );

    // reporting
    const report_definition = {
      error_max: 8,
      metrics_min: {
        precision: 0.5,
        recall: 0.5,
        f1: 0.5,
        accuracy: 0.5,
      },
    };

    const reporter = new ClassificationReporter({
      eval_run: eval_run,
      ...report_definition,
    });
    reporter.log();

    if (!reporter.pass) {
      core.setFailed("CI failed because the Okareo reporter failed.");
    }
  } catch (error) {
    core.setFailed("CI failed because: " + error.message);
  }
};
main();
