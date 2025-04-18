import { ExecutorContext } from '@nx/devkit';
import { TestExecutorSchema } from './schema';
import executor from './executor';

// mock exec of child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    if (callback) callback(null, { stdout: '' });
  }),
  execSync: jest.fn((command, options, callback) => {
    if (callback) callback(null, { stdout: '' });
  }),
}));
import * as cp from 'child_process';

describe('Test Executor', () => {
  const expectedEnv = {
    HOME: expect.any(String),
    PATH: expect.any(String),
    PHP_INI_DIR: expect.any(String),
    COMPOSER_HOME: expect.any(String),
    APPDATA: expect.any(String),
  };
  const expectedOptions = { cwd: '/root/apps/symfony', env: expectedEnv, stdio: 'inherit' };

  let options: TestExecutorSchema;
  let context: ExecutorContext;

  beforeEach(() => {
    options = {};
    context = {
      root: '/root',
      cwd: '/root',
      projectName: 'my-app',
      targetName: 'build',
      nxJsonConfiguration: {},
      projectsConfigurations: {
        version: 2,
        projects: {
          'my-app': {
            root: 'apps/symfony',
            sourceRoot: 'apps/symfony',
          },
        },
      },
      projectGraph: { nodes: {}, dependencies: {} },
      isVerbose: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can test', async () => {
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(`php  vendor/bin/phpunit`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can test in parallel', async () => {
    options.processes = 32;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(`php  vendor/bin/paratest -p32`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can test with codeCoverage flag', async () => {
    options.codeCoverage = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php -dpcov.enabled=1 -dpcov.directory="src" -dpcov.exclude="~vendor~" vendor/bin/phpunit --coverage-text`,
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can test with ci flag', async () => {
    options.ci = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php  vendor/bin/phpunit --log-junit phpunit-report.xml --coverage-cobertura cobertura-coverage.xml`,
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can test with verbose flag', async () => {
    context.isVerbose = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(`php  vendor/bin/phpunit --verbose`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can test with all flags', async () => {
    options.codeCoverage = true;
    options.ci = true;
    context.isVerbose = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php -dpcov.enabled=1 -dpcov.directory="src" -dpcov.exclude="~vendor~" vendor/bin/phpunit --coverage-text --log-junit phpunit-report.xml --coverage-cobertura cobertura-coverage.xml --verbose`,
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can test with all flags in parallel', async () => {
    options.processes = 64;
    options.codeCoverage = true;
    options.ci = true;
    context.isVerbose = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php -dpcov.enabled=1 -dpcov.directory="src" -dpcov.exclude="~vendor~" vendor/bin/paratest -p64 --coverage-text --log-junit phpunit-report.xml --coverage-cobertura cobertura-coverage.xml --verbose`,
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });
});
