import OpenAI from "openai";
import * as fs from 'fs';

// set up an OpenAI Assistant to evaluate in Okareo
// https://platform.openai.com/docs/assistants/tools/file-search/file-search-beta
const openai = new OpenAI();
 
async function main() {
  // step 1: create an OpenAI Assistant
  const webbizzInstructions = fs.readFileSync("src/context/instructions.txt", "utf-8");
  const assistant = await openai.beta.assistants.create({
    name: "WebBizz Analyst Assistant",
    instructions: webbizzInstructions,
    model: "gpt-4o",
    tools: [{ type: "file_search" }],
  });

  // step 2: upload files to Vector Store
  const fileStreams = ["src/context/webbizz-white-paper.txt"].map((path) =>
    fs.createReadStream(path),
  );
   
  // Create a vector store including our two files.
  let vectorStore = await openai.beta.vectorStores.create({
    name: "WebBizz White Paper",
  });
   
  await openai.beta.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, { files: fileStreams })

  // step 3: update the assistant t o use the Vector Store
  await openai.beta.assistants.update(assistant.id, {
    tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
  });

  // step 4: create a thread to test the assistant
  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content:
          "What B2B opportunities do you have for a SaaS company?",
      },
    ],
  });
  console.log(`Thread created: ${thread.id}`);

  // step 5: run the thread
  const messages = await openai.beta.threads.runs
  .stream(thread.id, {
    assistant_id: assistant.id,
  })
  .on("textCreated", () => console.log("assistant >"))
  .on("toolCallCreated", (event) => console.log("assistant " + event.type))
  .finalMessages()

  console.log("messages: ", messages);
  console.log("messages[0].content[0]: ", messages[0].content[0]);
}
 
main();