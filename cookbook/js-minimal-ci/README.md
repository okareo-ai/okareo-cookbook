### A Very Javscript Project using Okareo

## Example Project
This project is a minimalistic example of how Okareo can be used to build an E2E repo for model testing.
The approach used here can be used in any javscript project.
Although the Okareo library is primarily designed to work in Typescript.  It has been transpiled and tested in vanilla javascript node as well.

- yarn init
- yarn add --dev okareo-ts-sdk
- add a mechanism to run the project to package.json
``` json
  "scripts": {
    "run": "node src/index.js"
  }
  ```
- add a src directory
- add a index.js to the src directory
``` javascript
const okareo_sdk = require('okareo-ts-sdk');

const okareo = new okareo_sdk.Okareo({api_key:process.env.OKAREO_API_KEY, endpoint: process.env.OKAREO_BASE_URL});

const main = async () => {
    try {
        const projects = await okareo.getProjects();
        console.log(projects);
    } catch (error) {
        console.error(error);
    }
}

main();
```