/*import type {Config} from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
};
export default config;
*/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 600000, // 100 seconds (model evaluation can be lengthy)
};