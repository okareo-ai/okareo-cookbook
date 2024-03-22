# Okareo Python Example

This example provides the basic elements needed to get started with a Python based test environment for Okareo.

The process outline here is useful locally or in ci 

<h1>Setup</h1>
Install Okareo and setup your config

1. Download the apporpriate cli version for your environment from https://github.com/okareo-ai/okareo-cli/releases

2. Add the okareo-cli to your path.
``` shell
export OKAREO_BASE = "/path/to/cli/"
export PATH = $PATH;$OKAREO_BASE
```

3. Create a folder called ```.okareo``` in the location where you will be using the cli

4. Add a ```config.yml``` file to the folder
``` yml
name: PROJECT NAME 
api-key: ${OKAREO_API_KEY}
project-id: ${OKAREO_PROJECT_ID}
run:
  scripts:
    file-pattern: '.*\.py'
```

5. Add your ```OKAREO_API_KEY``` and ```OKAREO_PROJECT_ID``` to your environment.  You can also hard-code these in the config.  However, we strongly suggest passing them in as env vars as shown above.

6. Within ```.okareo/validations``` add any number of *.py tests that interact with Okareo.  

7. Run ```okareo-cli validate```.  This will run each file in the ```okareo/validations``` as a distinct test. Optionally you can use ```--file FILE_NAME.py``` to run a specific test.