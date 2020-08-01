module.exports = {
  globals: {
    "ts-jest": {
      "tsConfig": "tsconfig.base.json"
    }
  },
  "transform": {
    ".(ts|tsx)": "ts-jest"
  },
  "testEnvironment": "node",
  // "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  testMatch: [
    '<rootDir>/src/**/__tests__/*_jest.spec.(t|j)s',
    '<rootDir>/src/**/*.(spec|test).(t|j)s',
    '<rootDir>/test/**/*.(spec|test).(t|j)s',
  ],
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js"
  ],
  "coveragePathIgnorePatterns": [
    "/node_modules/",
    "src/index.ts",
    "/test/"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 95,
      "lines": 95,
      "statements": 95
    }
  },
  "collectCoverageFrom": [
    "src/*.{js,ts}"
  ]
}
