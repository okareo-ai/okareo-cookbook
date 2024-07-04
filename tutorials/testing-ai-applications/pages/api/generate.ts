import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import * as dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const SYSTEM_PROMPT = 'You are a coffee Q grader with lots of experience in the speciality coffee field.'

export function user_prompt(tasteNotes: string) : string {
  return 'I have brewed some coffee, and the notes I taste are:' +
    tasteNotes +
    '. Please respond with the most likely ' +
    'processing method used for this coffee. Be brief in the response, just mention the processing ' +
    'method name and no extra information. If multiple methods are likely, then mention the most likely ' +
    'options, but omit any extra information. The processing method should be succinct - avoid extraneous ' + 
    'words words like "processing" or "method" within this.';
}

async function tasteQuery(tasteNotes: string) : Promise<string> {
  const { data: completion, response } = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: user_prompt(tasteNotes) }
    ]
  }).withResponse();
  console.log("Completion: ", completion);
  let content = completion.choices[0].message.content || "error generating an answer"
  return content;
}

export default async function handler(req : NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case "POST":
      const content = req.body.message || "";
      const completion = await tasteQuery(content);
      res.status(200).json({ success: true , message: completion});
  }
}
