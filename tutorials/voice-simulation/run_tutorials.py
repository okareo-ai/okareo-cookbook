"""End-to-end test harness for voice simulation tutorials.
Runs each tutorial script as a subprocess and validates results via the Okareo SDK.

Usage: python run_tutorials.py
Requires: OKAREO_API_KEY env var
"""
import os
import sys
import subprocess
import time

from okareo import Okareo
from okareo_api_client.models import FindTestDataPointPayload

API_KEY = os.environ.get("OKAREO_API_KEY")
if not API_KEY:
    print("ERROR: OKAREO_API_KEY env var required", flush=True)
    sys.exit(1)

TIMEOUT_SECONDS = 900
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

okareo = Okareo(API_KEY)  # honors OKAREO_BASE_URL env var


def find_run(name):
    """Find the most recent FINISHED run by exact name."""
    runs = okareo.find_test_runs(name=name, return_model_metrics=True)
    matching = [r for r in runs if r.get("status") == "FINISHED"]
    if not matching:
        return None
    return sorted(matching, key=lambda r: r.get("time_created", ""), reverse=True)[0]


def find_run_any_status(name):
    """Find the most recent run by exact name (any status)."""
    runs = okareo.find_test_runs(name=name, return_model_metrics=True)
    if not runs:
        return None
    return sorted(runs, key=lambda r: r.get("time_created", ""), reverse=True)[0]


def get_datapoints(run_id):
    datapoints = okareo.find_test_data_points(
        FindTestDataPointPayload(test_run_id=run_id, full_data_point=True)
    )
    return [dp.to_dict() for dp in datapoints]


def run_script(script_name):
    """Run script as subprocess with unbuffered output."""
    print(f"  Running {script_name}...", flush=True)
    start = time.time()
    result = subprocess.run(
        [sys.executable, "-u", script_name],
        cwd=SCRIPT_DIR,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        timeout=TIMEOUT_SECONDS,
    )
    elapsed = time.time() - start
    if result.stdout.strip():
        for line in result.stdout.strip().split("\n"):
            print(f"    {line}", flush=True)
    if result.stderr.strip():
        for line in result.stderr.strip().split("\n")[:5]:
            print(f"    [err] {line}", flush=True)
    print(f"  exit={result.returncode} ({elapsed:.1f}s)", flush=True)
    return result.returncode, result.stdout


def assert_check(condition, msg):
    if not condition:
        raise AssertionError(msg)


# ============================================================
# Validators — one per script, with real assertions
# ============================================================

def validate_01():
    """01: generate_driver_prompt + first sim + latency check."""
    run = find_run("First Voice Sim")
    assert_check(run, "Run 'First Voice Sim' not found")
    scores = (run.get("model_metrics") or {}).get("mean_scores", {})
    assert_check("avg_turn_taking_latency" in scores, "avg_turn_taking_latency not in scores")

    dps = get_datapoints(run["id"])
    assert_check(len(dps) >= 1, f"Expected >= 1 datapoint, got {len(dps)}")

    meta = dps[0].get("model_metadata", {})
    msgs = meta.get("messages", [])
    assert_check(len(msgs) >= 2, f"Expected >= 2 messages, got {len(msgs)}")
    assert_check(msgs[0].get("metadata", {}).get("start_time"), "First message missing start_time")


def validate_02():
    """02: persona driver + Joey voice + multi-turn."""
    run = find_run("Hesitant Persona Sim")
    assert_check(run, "Run 'Hesitant Persona Sim' not found")
    scores = (run.get("model_metrics") or {}).get("mean_scores", {})
    assert_check("avg_turn_taking_latency" in scores, "Missing latency")
    assert_check("result_completed" in scores, "Missing result_completed")

    dps = get_datapoints(run["id"])
    assert_check(len(dps) >= 1, f"Expected >= 1 datapoint, got {len(dps)}")
    msgs = dps[0].get("model_metadata", {}).get("messages", [])
    assert_check(len(msgs) >= 3, f"Expected >= 3 messages (multi-turn), got {len(msgs)}")


def validate_03():
    """03: all 5 checks present with valid values."""
    run = find_run("Voice Checks Demo")
    assert_check(run, "Run 'Voice Checks Demo' not found")
    scores = (run.get("model_metrics") or {}).get("mean_scores", {})

    expected = ["avg_turn_taking_latency", "result_completed", "response_consistency",
                "total_turn_count", "response_loop"]
    for check in expected:
        assert_check(check in scores, f"Missing check: {check}")

    assert_check(scores["total_turn_count"] > 0, f"total_turn_count should be > 0, got {scores['total_turn_count']}")
    assert_check(scores["result_completed"] in (0, 1, 0.0, 1.0),
                 f"result_completed should be 0 or 1, got {scores['result_completed']}")


def validate_04():
    """04: 3 datapoints, each with wav_path audio that's downloadable."""
    run = find_run("Multi-Scenario Voice Sim")
    assert_check(run, "Run 'Multi-Scenario Voice Sim' not found")

    dps = get_datapoints(run["id"])
    assert_check(len(dps) >= 3, f"Expected >= 3 datapoints (3 scenarios), got {len(dps)}")

    for i, dp in enumerate(dps):
        meta = dp.get("model_metadata", {})
        msgs = meta.get("messages", [])
        assert_check(len(msgs) >= 2, f"dp[{i}]: Expected >= 2 messages, got {len(msgs)}")

        # Check transcript content is non-empty
        content = " ".join(m.get("content", "") for m in msgs)
        assert_check(len(content) > 10, f"dp[{i}]: Transcript too short: '{content[:50]}'")

        # Check wav_path is present and downloadable
        wav_urls = [m.get("metadata", {}).get("wav_path") for m in msgs
                    if m.get("metadata", {}).get("wav_path")]
        assert_check(len(wav_urls) > 0, f"dp[{i}]: No wav_path URLs in messages")

        audio_bytes = okareo.download_voice(wav_urls[0])
        assert_check(len(audio_bytes) > 0, f"dp[{i}]: wav_path download returned no audio")


def validate_05():
    """05: rescore created a new run with different checks, no new sim."""
    run = find_run_any_status("Rescore - New Checks")
    assert_check(run, "Run 'Rescore - New Checks' not found")
    assert_check(run.get("status") == "FINISHED", f"Rescore run status: {run.get('status')}")

    scores = (run.get("model_metrics") or {}).get("mean_scores", {})
    assert_check("response_consistency" in scores or "total_turn_count" in scores,
                 f"Expected new checks in rescore run, got: {list(scores.keys())}")


def validate_06():
    """06: augmentation run completed with messages."""
    run = find_run("Augmentation - Noise + Barge-In")
    assert_check(run, "Run 'Augmentation - Noise + Barge-In' not found")
    scores = (run.get("model_metrics") or {}).get("mean_scores", {})
    assert_check("avg_turn_taking_latency" in scores, "Missing latency")

    dps = get_datapoints(run["id"])
    assert_check(len(dps) >= 1, f"Expected >= 1 datapoint, got {len(dps)}")
    msgs = dps[0].get("model_metadata", {}).get("messages", [])
    assert_check(len(msgs) >= 2, f"Expected >= 2 messages, got {len(msgs)}")
    assert_check(msgs[0].get("metadata", {}).get("start_time"), "Missing timing metadata")


def validate_07(exit_code):
    """07: CI gate — exit code is 0 or 1, 4 datapoints exist."""
    assert_check(exit_code in (0, 1), f"CI gate exit code should be 0 or 1, got {exit_code}")

    run = find_run("CI Gate - Voice Quality")
    assert_check(run, "Run 'CI Gate - Voice Quality' not found")

    dps = get_datapoints(run["id"])
    assert_check(len(dps) >= 4, f"Expected >= 4 datapoints (2 scenarios x 2 repeats), got {len(dps)}")


def validate_08():
    """08: load test — 20 datapoints, latency stats printed."""
    run = find_run("Load Test - Voice Quality")
    assert_check(run, "Run 'Load Test - Voice Quality' not found")

    dps = get_datapoints(run["id"])
    assert_check(len(dps) >= 20, f"Expected >= 20 datapoints (4 scenarios x 5 repeats), got {len(dps)}")

    # Verify latency data exists across datapoints
    latency_count = 0
    for dp in dps:
        meta = dp.get("model_metadata", {})
        for msg in meta.get("messages", []):
            if msg.get("metadata", {}).get("latency", 0) > 0:
                latency_count += 1
    assert_check(latency_count > 0, "No latency measurements found in load test")


# ============================================================
# Main runner
# ============================================================

SCRIPTS = [
    ("01_first_voice_sim.py", validate_01),
    ("02_driver_persona.py", validate_02),
    ("03_checks.py", validate_03),
    ("04_scenarios.py", validate_04),
    ("05_rescore.py", validate_05),
    ("06_augmentation.py", validate_06),
    ("07_ci_gate.py", None),  # special: uses exit code
    ("08_load_test.py", validate_08),
]

if __name__ == "__main__":
    print("=" * 60, flush=True)
    print("  Voice Simulation Tutorial E2E Tests", flush=True)
    print("=" * 60, flush=True)

    passed = []
    failed = []

    for script, validator in SCRIPTS:
        print(f"\n{'─'*60}", flush=True)
        print(f"  {script}", flush=True)
        print(f"{'─'*60}", flush=True)

        try:
            exit_code, stdout = run_script(script)

            if script == "07_ci_gate.py":
                validate_07(exit_code)
            else:
                assert_check(exit_code == 0, f"{script} exited with code {exit_code}")
                if validator:
                    validator()

            print(f"  PASSED", flush=True)
            passed.append(script)

        except subprocess.TimeoutExpired:
            print(f"  TIMEOUT ({TIMEOUT_SECONDS}s)", flush=True)
            failed.append(script)
        except AssertionError as e:
            print(f"  FAILED: {e}", flush=True)
            failed.append(script)
        except Exception as e:
            print(f"  ERROR: {type(e).__name__}: {e}", flush=True)
            failed.append(script)

    print(f"\n{'=' * 60}", flush=True)
    print(f"  Results: {len(passed)} passed, {len(failed)} failed", flush=True)
    if failed:
        print(f"  Failed: {', '.join(failed)}", flush=True)
        sys.exit(1)
    print("  All tutorials passed.", flush=True)
