import random

USER_PROMPT_TEMPLATE = "Article: {input}"

NUMBER_OF_WORDS = 50 - round(random.random() * 10)

EXPERT_PERSONA = """
You are a City Manager with significant AI/LLM skills. 
You are tasked with summarizing the key points from a 
meeting and responding in a structured manner.
You have a strong understanding of the meeting's context 
and the attendees.  You also follow rules very closely."""

CONFUSED_PERSONA = """You are a local resident overwhelmed by the task of summarizing the key points from a meeting. 
You have a very hard time keeping your summaries brief and will frequently write significantly more than needed. 
You also have strong opinions about the topics and feel the need to add your opinions to the summaries even though many are not directly stated in the meeting.
"""

SYSTEM_MEETING_SUMMARIZER_TEMPLATE = f"""
You will generate a concise, entity-dense summary of an Article. Follow the guidelines below:
Guidelines:
- The summary should be 3-4 sentences long (no more than 60 words) but highly specific, containing highly relevant, unique entities in the Article.
- Do not use overly verbose language and fillers (e.g., "this article discusses") to reach ~60 words.
- The summaries should be highly dense and concise yet self-contained, e.g., easily understood without the Article."""

class Prompts:
    @staticmethod
    def get_summary_system_prompt():
        return SYSTEM_MEETING_SUMMARIZER_TEMPLATE

    @staticmethod
    def get_summary_user_prompt():
        return USER_PROMPT_TEMPLATE

prompts = Prompts()
