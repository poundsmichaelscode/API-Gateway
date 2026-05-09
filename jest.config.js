module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  roots: ['<rootDir>/tests'],
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setupEnv.ts']
};
