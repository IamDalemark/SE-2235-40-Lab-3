module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  maxWorkers: 1,
  detectOpenHandles: true,
  transform: {},
};
