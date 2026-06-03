# Voice Simulation Tutorials

Automated quality assurance for voice agents. Each script demonstrates one capability — run it, see the result, use it in your workflow.

## Prerequisites

- Python 3.9+
- `pip install okareo`
- `export OKAREO_API_KEY=your_key`

That's it. Okareo handles the phone calls, the simulated callers, the recordings, and the quality scoring.

## Quick Start

```bash
pip install okareo
export OKAREO_API_KEY=...
python 01_first_voice_sim.py
```

## Tutorials

| Script | What It Does | What You Get |
|--------|--------------|--------------|
| `01_first_voice_sim.py` | Describe a caller in one sentence → real phone conversation | AI-generated driver prompt → live call → results in <2 min |
| `02_driver_persona.py` | Production-quality persona with voice + tone control | Hand-crafted persona + voice identity + emotional tone |
| `03_checks.py` | Apply quality checks: resolution, consistency, loops | 5 checks with human-readable pass/fail explanations |
| `04_scenarios.py` | Run multiple callers, get recordings and transcripts | Multi-row scenarios + downloadable audio + full transcripts |
| `05_rescore.py` | Add new checks to an existing run — no new call | Re-evaluate without burning another phone call |
| `06_augmentation.py` | Inject real-world conditions: noise, barge-in | Test agent resilience under adverse audio |
| `07_ci_gate.py` | Threshold-based pass/fail for CI pipelines | Exits non-zero when quality drops below threshold |
| `08_load_test.py` | Stress-test with 20 concurrent calls | Latency distribution (p50/p90) under volume |

## How These Build on Each Other

1. **Get running** (01) — One env var, one command, first result.
2. **Make it realistic** (02-04, 06) — Custom personas, quality metrics, recordings, stress conditions.
3. **Share across your team** (05, 07-08) — CI gates, scale testing, cost-free re-evaluation.

Every script runs independently. Run them in order for the guided path, or jump to what you need.

## Progression

```
01 (first call) → 02 (persona) → 03 (quality checks)
    → 04 (scenarios + recordings) → 05 (iterate cheaply)
    → 06 (stress conditions) → 07 (CI gate) → 08 (load test)
```
