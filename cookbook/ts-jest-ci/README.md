### A Very Simple Project using Okareo

# Okareo + Jest + Typescript
This recipe demonstrates the use of Okareo as part of an existing project that incldues Jest.

The approach used here creates a unique and parallel jest unit testing path specific to model testing.  The approach is particularly useful and necessary when building within a mono-repo or a full-stack typescript application with client and server components.

<h2>Setup</h2>

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
- create jest.model-config.ts
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
- update package.json to include two scripts
```
  "test": "jest"
  "jest:model": "jest test-models --config ./jest.model-config.js",
```
- yarn add --dev okareo-ts-sdk
- add a mechanism to run the project to package.json
``` json
  "scripts": {
    "run": "tsc && node dist/index.js"
  }
  ```
- make a directory called test-models
- add your first test
- Example: projects.test.ts
``` Typescript
import { Okareo } from 'okareo-ts-sdk';

const OKAREO_API_KEY = process.env.OKAREO_API_KEY || "<YOUR_OKAREO_KEY>";

describe(' Working with Projects', () => {
    test('Get Projects', async () =>  {
        const okareo = new Okareo({api_key:OKAREO_API_KEY});
        const data: any[] = await okareo.getProjects();
        expect(data.length).toBeGreaterThanOrEqual(0);
    });
});
```