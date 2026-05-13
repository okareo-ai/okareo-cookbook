#!/usr/bin/env python3
import os
from okareo import Okareo
from okareo.checks import CheckOutputType, ModelBasedCheck

OKAREO_API_KEY = os.environ["OKAREO_API_KEY"]

okareo = Okareo(OKAREO_API_KEY)
print(f"""Connected to Okareo
    with key: {OKAREO_API_KEY[:4]}...{OKAREO_API_KEY[-4:]}""")

MIN_FLIGHTS_PROVIDED = """You will be given an agent conversation. Review the agent side of the conversation to make sure it provided at least 3 flight options to the user.

Your task is to rate the conversation on one metric: Flight Options Provided >= 3.

Please make sure you read and understand these instructions carefully. Please keep this document open while reviewing, and refer to it as needed.

Evaluation Criteria:

Flight Options Provided (0 or 1) - whether the Model Output provides 3 or more flight options to the user.

- 1 = Pass: The conversation offers at least 3 distinct flight options.
- 0 = Fail: The conversation includes fewer than 3 flight options, or does not provide flight options at all.

Evaluation Steps:

1. Read the agent output in the conversation and check whether it contains 3 or more distinct flight options.
2. Decide whether the conversation satisfies the requirement to provide 3 or more flight options.
3. Write a brief explanation for your pass/fail, enclosed in double parentheses, e.g. ((The Conversation includes three flight options.))
4. Assign a score for Flight Options Provided (0 or 1):
   - 1 if the agent provides at least 3 distinct flight options.
   - 0 if the agent provides fewer than 3 flight options or no flight options.

<Examples>

Conversation:

Flight option 1: Delta, nonstop, $320
Flight option 2: United, 1 stop, $295
Flight option 3: American, nonstop, $340

Flight Options Provided (0 or 1):

Explanation: ((The agent provides three distinct flight options, satisfying the requirement.))

Score: [[1]]

</Examples>

Conversation:
Flight option 1: Delta, nonstop, $320

Flight Options Provided (0 or 1):

Explanation: ((The agent provides only one flight option, which is fewer than three.))

Score: [[0]]

</Examples>

Full Conversation:
{message_history}

Flight Options Provided (0 or 1):
"""

check = ModelBasedCheck(
    prompt_template=MIN_FLIGHTS_PROVIDED,
    check_type=CheckOutputType.PASS_FAIL,
)

# Create or update the check
okareo.create_or_update_check(
    name="Min Flights",
    description= "The travel concierge provided 3 or more flight options to the user.",
    check=check
)
print(f"✅ check created!")

