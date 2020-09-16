module.exports = {
    testEnvironment: "node",
    bail: false,
    verbose: true,
    transform: {
        "^.+\\.tsx?$": "ts-jest",
    },
    testMatch: ["**/*.test.ts"],
    collectCoverage: true,
    coverageDirectory: "<rootDir>/.coverage",
    collectCoverageFrom: ["src/**/*.ts", "!src/index.ts", "!**/node_modules/**"],
    coverageReporters: ["json", "lcov", "text", "clover", "html"],
    coveragePathIgnorePatterns: ["<rootDir>/src/routes/"],
    // coverageThreshold: {
    //     global: {
    //         branches: 100,
    //         functions: 100,
    //         lines: 100,
    //         statements: 100,
    //     },
    // },
    watchman: false,
    setupFilesAfterEnv: ["jest-extended"],
};
