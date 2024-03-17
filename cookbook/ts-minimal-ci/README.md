### A Very Simple Project using Okareo

## Example Project
This project is a minimalistic example of how Okareo can be used to build an E2E repo for model testing.
The approach used here can be used in any typescript project.

- yarn init
- yarn add --dev typescript
- create tsconfig.json
 ``` json
 {
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "target": "es6",
    "moduleResolution": "node",
    "sourceMap": true,
    "outDir": "dist"
  },
  "lib": ["es2015"]
}
```
- yarn add --dev okareo-ts-sdk
- add a mechanism to run the project to package.json
``` json
  "scripts": {
    "run": "tsc && node dist/index.js"
  }
  ```
- add a src directory
- add a index.ts to the src directory
``` Typescript
import { Okareo } from 'okareo-ts-sdk';

const okareo = new Okareo({api_key:process.env.OKAREO_API_KEY, endpoint: process.env.OKAREO_BASE_URL});

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
