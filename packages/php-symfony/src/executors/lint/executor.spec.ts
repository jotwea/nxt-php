import { ExecutorContext } from '@nx/devkit';
import { LintExecutorSchema } from './schema';
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

jest.mock('fs', () => ({
  readdirSync: jest.fn((path, options) => [
    { name: 'project.json', isDirectory: () => false },
    { name: 'config', isDirectory: () => true },
    { name: 'src', isDirectory: () => true },
    { name: 'vendor', isDirectory: () => true },
  ]),
  existsSync: jest.fn((path) => false),
}));
import * as fs from 'fs';

describe('Lint Executor', () => {
  const expectedEnv = { HOME: expect.any(String), PATH: expect.any(String), PHP_INI_DIR: expect.any(String) };
  const expectedOptions = { cwd: '/root/apps/symfony', env: expectedEnv, stdio: 'inherit' };
  const expectedPaths = ['config', 'src'];

  let options: LintExecutorSchema;
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
      },
      isVerbose: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can lint [PHP only]', async () => {
    const output = await executor(options, context);

    expect(cp.execSync).not.toHaveBeenCalled();
    expect(output.success).toBe(true);
  });

  it('can lint [container only]', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/apps/symfony/bin/console');
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can lint [PHP+container]', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/bin/parallel-lint'
      );
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(`php vendor/bin/parallel-lint --colors config src`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can lint [container+Twig]', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/symfony/twig-bundle'
      );
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(
      `php bin/console lint:twig --show-deprecations config src`,
      expectedOptions
    );
    expect(output.success).toBe(true);
  });

  it('can lint [container+YAML]', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/symfony/yaml'
      );
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:yaml --parse-tags config src`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can lint [container+doctrine]', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) =>
          path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/doctrine/doctrine-bundle'
      );
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console doctrine:schema:validate --skip-sync`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can lint all components', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(5);
    expect(output.success).toBe(true);
  });
});
