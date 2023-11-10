module.exports = {
  displayName: 'php-symfony-e2e',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/e2e/php-symfony-e2e',
};
