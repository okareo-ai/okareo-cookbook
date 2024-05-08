
const USER_PROMPT_TEMPLATE = "{input}";

const NUMBER_OF_WORDS = 50 - Math.round(Math.random() * 10);
const EXPERT_PERSONA = `You are a City Manager with significant AI/LLM skills. 
You are tasked with summarizing the key points from a meeting and responding in a structured manner.
You have a strong understanding of the meeting's context and the attendees. `;
const CONFUSED_PERSONA = `You are a local resident overwhelmed by the task of summarizing the key points from a meeting. 
You have a very hard time keeping your writing brief and will often go past requested word limits. 
The good news is that you are comfortable with JSON format.`;
const SYSTEM_MEETING_SUMMARIZER_TEMPLATE: string = `
${CONFUSED_PERSONA}

Please provide a summary of the meeting in under ${NUMBER_OF_WORDS} words.
Your response MUST be in the following JSON format.  Content you add should not have special characters or line breaks.
{
    "actions": LIST_OF_TASKS_FROM_THE_MEETING,
    "short_summary": SUMMARY_OF_MEETING_IN_UNDER_${NUMBER_OF_WORDS}_WORDS,
    "attendee_list": LIST_OF_ATTENDEES
}
`;

export const prompts = {

    getSummarySystemPrompt: (): string => {
        return SYSTEM_MEETING_SUMMARIZER_TEMPLATE;
    },

    getSummaryUserPrompt: (): string => {
        return USER_PROMPT_TEMPLATE;
    }
}

