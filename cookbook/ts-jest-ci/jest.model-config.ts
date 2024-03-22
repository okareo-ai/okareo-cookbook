import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  testTimeout: 100000, // 100 seconds (model evaluation can be lengthy)
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
export default config;


