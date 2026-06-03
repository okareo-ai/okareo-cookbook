"""04 — Scenarios + Recording/Transcript
Run multiple callers, get recordings and transcripts for each.

Demonstrates:
- Multi-row scenarios with template variables (one conversation per row)
- Fetching per-turn audio recordings (wav_path)
- Extracting full conversation transcripts programmatically
"""
import os
import httpx
from okareo import Okareo
from okareo.model_under_test import Driver, Target, TwilioVoiceTarget
from okareo_api_client.models import ScenarioSetCreate, FindTestDataPointPayload
from shared import API_KEY, TARGET_PHONE, DRIVER_PROMPT, DEFAULT_VOICE_INSTRUCTIONS

okareo = Okareo(os.environ["OKAREO_API_KEY"])

driver = Driver(
    name="Scenario Caller",
    prompt_template=DRIVER_PROMPT,
    voice_instructions=DEFAULT_VOICE_INSTRUCTIONS,
    temperature=0.8,
)

scenario = okareo.create_scenario_set(ScenarioSetCreate(
    name="Voice Sim - Multi Scenario",
    seed_data=okareo.seed_data_from_list([
        {"input": "You were double-charged $150 on your credit card. "
                  "Get it reversed. Confirm the refund timeline.",
         "result": "Agent identifies duplicate charge and initiates refund"},
        {"input": "You need to update your shipping address before your package ships tomorrow. "
                  "Confirm the new address is on file.",
         "result": "Agent updates address and confirms change"},
        {"input": "You want to know if your warranty covers a cracked screen. "
                  "Ask about the claim process.",
         "result": "Agent checks warranty status and explains coverage"},
    ]),
))

result = okareo.run_simulation(
    name="Multi-Scenario Voice Sim",
    target=Target(name="Voice Cookbook Target", target=TwilioVoiceTarget(to_phone_number=TARGET_PHONE)),
    scenario=scenario,
    driver=driver,
    max_turns=4,
    checks=["avg_turn_taking_latency", "result_completed", "response_loop"],
)

print(f"Status: {result.status}")
print(f"Results: {result.app_link}")

# Fetch datapoints and extract recordings + transcripts
datapoints = okareo.find_test_data_points(
    FindTestDataPointPayload(test_run_id=result.id, full_data_point=True)
)

BASE_URL = os.environ.get("OKAREO_BASE_URL", "https://api.okareo.com")
RECORDING_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "recordings")
os.makedirs(RECORDING_DIR, exist_ok=True)

for i, dp in enumerate(datapoints):
    meta = dp.model_metadata.additional_properties
    call_sid = meta.get("call_sid")
    messages = meta.get("messages", [])

    print(f"\n{'='*50}")
    print(f"  Conversation {i+1} ({len(messages)} messages)")
    print(f"{'='*50}")

    # Download full call recording
    if call_sid:
        recording_url = f"{BASE_URL}/v0/voice/call_sid/{call_sid}"
        filepath = os.path.join(RECORDING_DIR, f"conv{i+1}_full.wav")
        resp = httpx.get(recording_url, headers={"api-key": API_KEY}, follow_redirects=True)
        if resp.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(resp.content)
            print(f"  Recording: {filepath} ({len(resp.content) // 1024} KB)")
        else:
            print(f"  Recording download failed: HTTP {resp.status_code}")

    # Print transcript
    for msg in messages:
        role = msg["role"]
        content = msg.get("content", "")
        print(f"  [{role:9s}] {content[:100]}{'...' if len(content) > 100 else ''}")
