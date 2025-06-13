import os from "os";
import fs from "fs/promises";
import path from "path";
import { Okareo, TestRunType, OpenAIModel } from "okareo-ts-sdk";

const OKAREO_API_KEY = process.env.OKAREO_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROJECT_ID = process.env.PROJECT_ID || "";

if (!OKAREO_API_KEY || !OPENAI_API_KEY || !PROJECT_ID) {
  throw new Error(
    "Missing API keys or Project ID. Please check your .env file.",
  );
}

const SUMMARIZATION_CONTEXT_TEMPLATE: string = `
You will be provided with text.
Summarize the text in 1 simple sentence.
`;
const USER_PROMPT_TEMPLATE = "{scenario_input}";

const okareo = new Okareo({ api_key: OKAREO_API_KEY });

const RAW_URL =
  "https://raw.githubusercontent.com/okareo-ai/okareo-python-sdk/main/examples/webbizz_10_articles.jsonl";

const downloadCorpus = async () => {
  const res = await fetch(RAW_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

  const lines = (await res.text()).trim().split("\n").slice(0, 3); // keep 3 docs
  const tmpFile = path.join(os.tmpdir(), "webbizz_3_articles.jsonl");
  await fs.writeFile(tmpFile, lines.join("\n"));
  return tmpFile;
};

async function main() {
  try {
    const UNIQUE_BUILD_ID = Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

    const corpusPath = await downloadCorpus();

    const model_under_test = await okareo.register_model({
      name: `Example Generation Model - ${UNIQUE_BUILD_ID}`,
      tags: ["OpenAI", "Example"],
      project_id: PROJECT_ID,
      models: {
        type: "openai",
        model_id: "gpt-3.5-turbo",
        temperature: 0.0,
        system_prompt_template: SUMMARIZATION_CONTEXT_TEMPLATE,
        user_prompt_template: USER_PROMPT_TEMPLATE,
      } as OpenAIModel,
      update: true,
    });

    const scenario = await okareo.upload_scenario_set({
      file_path: corpusPath,
      scenario_name: `Webbizz Articles Scenario - ${UNIQUE_BUILD_ID}`,
      project_id: PROJECT_ID,
    });

    fs.unlink(corpusPath).catch(() => null);

    const evaluation = await model_under_test.run_test({
      name: `Example Generation - ${UNIQUE_BUILD_ID}`,
      tags: ["Generation", UNIQUE_BUILD_ID],
      model_api_key: OPENAI_API_KEY,
      project_id: PROJECT_ID,
      scenario: scenario,
      calculate_metrics: true,
      type: TestRunType.NL_GENERATION,
    });

    console.log("Evaluation complete:", evaluation);
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();
