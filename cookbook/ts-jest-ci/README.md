### A Very Simple Project using Okareo

## Example Project
This project is a minimalistic example of how Okareo can be used to build an E2E repo for model testing.
The approach used here can be used in any typescript project.

- yarn init
- yarn add --dev typescript @types/node ts-node
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
- yarn add -D jest @types/jest ts-jest
- create jest.config.ts
``` Typescript
import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
  ‘^.+\\.tsx?$’: ‘ts-jest’,
  },
};
export default config;
```
- update package.json to include ```"test": "jest"``` in the "scripts" list
- yarn add --dev okareo-ts-sdk
- add a mechanism to run the project to package.json
``` json
  "scripts": {
    "run": "tsc && node dist/index.js"
  }
  ```
- make a directory called tests
- add your first test
- Example: projects.test.ts
``` Typescript
import { Okareo } from 'okareo-ts-sdk';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";
const OKAREO_BASE_URL = process.env.OKAREO_BASE_URL || "https://api.okareo.com/";

describe(' Working with Projects', () => {
    test('Get Projects', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY, endpoint: OKAREO_BASE_URL});
        const data: any[] = await okareo.getProjects();
        expect(data.length).toBeGreaterThanOrEqual(0);
    });
});
```