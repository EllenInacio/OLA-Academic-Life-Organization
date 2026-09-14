/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/src/tests/setupEnv.ts"],
  testMatch: ["<rootDir>/src/tests/**/*.test.ts"],
  maxWorkers: 1,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/generated/**",
    "!src/tests/**",
    "!src/server.ts"
  ]
};
