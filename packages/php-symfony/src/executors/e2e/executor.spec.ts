import { ExecutorContext } from '@nrwl/devkit';
import { E2ETestExecutorSchema } from './schema';
import executor from './executor';

// mock exec of child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    callback && callback(null, { stdout: '' });
  }),
  execSync: jest.fn((command, options, callback) => {
    callback && callback(null, { stdout: '' });
  }),
}));
import * as cp from 'child_process';
import * as fs from 'fs';

describe('E2E Test Executor', () => {
  const expectedEnv = { HOME: expect.any(String), PATH: expect.any(String), PHP_INI_DIR: expect.any(String) };
  const expectedOptions = { cwd: '/root/apps/symfony', env: expectedEnv, stdio: 'inherit' };
  const spyOnExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

  let options: E2ETestExecutorSchema;
  let context: ExecutorContext;

  beforeEach(() => {
    options = {};
    context = {
      root: '/root',
      cwd: '/root',
      projectName: 'my-app',
      targetName: 'build',
      workspace: {
        version: 2,
        projects: {
          'my-app': <any>{
            root: 'apps/symfony',
            sourceRoot: 'apps/symfony',
          },
        },
        npmScope: 'test',
      },
      isVerbose: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can test e2e', async () => {
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(`php  vendor/bin/phpunit tests_e2e`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can test e2e with codeCoverage flag', async () => {
    options.codeCoverage = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php -dpcov.enabled=1 -dpcov.directory="src" -dpcov.exclude="~vendor~" vendor/bin/phpunit tests_e2e --coverage-text`,
      expectedOptions
    );
    expect(output.success).toBe(true);
  });

  it('can test e2e with ci flag', async () => {
    options.ci = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php  vendor/bin/phpunit tests_e2e --log-junit phpunit-report.xml --coverage-cobertura coverage.cobertura.xml`,
      expectedOptions
    );
    expect(output.success).toBe(true);
  });

  it('can test e2e with verbose flag', async () => {
    context.isVerbose = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(`php  vendor/bin/phpunit tests_e2e --verbose`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can test e2e with all flags', async () => {
    options.codeCoverage = true;
    options.ci = true;
    context.isVerbose = true;
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledWith(
      `php -dpcov.enabled=1 -dpcov.directory="src" -dpcov.exclude="~vendor~" vendor/bin/phpunit tests_e2e --coverage-text --log-junit phpunit-report.xml --coverage-cobertura coverage.cobertura.xml --verbose`,
      expectedOptions
    );
    expect(output.success).toBe(true);
  });

  it('can skip e2e test for not existing tests_e2e directory', async () => {
    const spyOnExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const output = await executor(options, context);

    expect(spyOnExists).toHaveBeenCalledWith('/root/apps/symfony/tests_e2e');
    expect(cp.execSync).not.toHaveBeenCalled();
    expect(output.success).toBe(true);
  });
});
