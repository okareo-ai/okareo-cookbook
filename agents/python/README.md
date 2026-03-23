# Sample Agents

This folder contains sample agent samples for
[Python Agent Development Kit](https://github.com/google/adk-python) (Python ADK).

Each folder in this directory contains a different agent sample.

## Getting Started

1.  **Prerequisites:**

    *   Python Agent Development Kit. See the
        [ADK Quickstart Guide](https://google.github.io/adk-docs/get-started/quickstart/).
    *   Python 3.9+ and [Poetry](https://python-poetry.org/docs/#installation).
    *   Access to Google Cloud (Vertex AI) and/or a Gemini API Key (depending on
        the agent - see individual agent READMEs).

2.  **Running a Sample Agent:**

    *   Navigate to the specific agent's directory (e.g., `cd agents/llm-auditor`).
    *    Copy the `.env.example` file to `.env` and fill in the required
         environment variables (API keys, project IDs, etc.). See the agent's
         specific README for details on required variables.
    *   Install dependencies using Poetry: `poetry install`
    *   Follow the instructions in the agent's `README.md` to run it (e.g.,
        using `adk run .` or `adk web` or `adk api_server`).
