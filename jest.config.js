module.exports = {
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    "**/dist/model.mjs"
  ],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)", // Jest 기본 설정
    "**/?(*.)+(spec|test).[tj]s?(x)", // Jest 기본 설정
    "**/?(*.)+(test).mjs"
  ],
};