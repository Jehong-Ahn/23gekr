module.exports = {
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    "**/dist/model.js"
  ],
};