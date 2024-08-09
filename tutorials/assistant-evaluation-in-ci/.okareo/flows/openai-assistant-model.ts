import OpenAI from "openai";

// set up an OpenAI Assistant to evaluate in Okareo
const OPENAI_ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID || "asst_AL0HD1OdpVZaXYcsGfwva58u";

const openai = new OpenAI();

async function callOpenAIAssistantThread(
    userMessage: string,
    debug: boolean = false
): Promise<any> {

    // get the assistant object
    const assistant = await openai.beta.assistants.retrieve(OPENAI_ASSISTANT_ID);

    // create a thread to test the assistant
    const thread = await openai.beta.threads.create({
    messages: [
        {
            role: "user",
            content: userMessage,
        },
    ],
    });

    if (debug) {
        console.log(`Thread created: ${thread.id}`);
    }

    // run the thread
    const output = await openai.beta.threads.runs.stream(thread.id, {
        assistant_id: assistant.id,
    }).finalMessages();
    return output;
}

export async function invoke(input: string) {
    // TODO: finish implementing this
    const time_started = new Date().getTime();
    const messages = await callOpenAIAssistantThread(input);
    const time_ended = new Date().getTime();
    return {
        model_prediction: messages[0].content[0].text.value,
        model_input: input,
        model_output_metadata: {
            time_started,
            time_ended, 
            time_elapsed_sec: (time_ended - time_started) / 1000,
            full_response: messages,
        }
    };
};