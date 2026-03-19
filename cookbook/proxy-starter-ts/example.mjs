import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://localhost:4000",
});

async function main() {
  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: "user", content: "Say 'Hi' in Klingon" }],
    model: "gpt-4o-mini",
  });
  console.log(JSON.stringify(chatCompletion, null, 2));
}

main();
