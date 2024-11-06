# Example code for the RAG evaluation blog post

## How to run the evaluation

- Sign up for an Okareo account https://app.okareo.com/account/login
- Install Okareo locally: https://docs.okareo.com/docs/sdk/cli
- Export environment variables: 

```export OKAREO_API_KEY=<YOUR_OKAREO_API_KEY>
export OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
export OKAREO_PROJECT_ID=<YOUR_OKAREO_PROJECT_ID>
export OKAREO_PATH="<YOUR_OKAREO_PATH>"
export PATH="$PATH:$OKAREO_PATH/bin"
```

- Create python virtual environment
```
python -m venv venv
source venv/bin/activate
```

- From this directory, run the Okareo flow script in .okareo/flows with this command ```okareo run --debug```
