const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1", // mendukung import seperti @/lib/... dll
  },
  testMatch: ["**/tests/**/*.test.ts"], // cari file test di folder /tests
  roots: ["<rootDir>/src", "<rootDir>/tests"], // lokasi pencarian module
};