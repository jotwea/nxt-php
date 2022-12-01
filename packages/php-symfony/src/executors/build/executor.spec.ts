import { ExecutorContext } from '@nrwl/devkit';
import * as fs from 'fs';
import { BuildExecutorSchema } from './schema';
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

const expectedEnv = { HOME: expect.any(String), PATH: expect.any(String), PHP_INI_DIR: expect.any(String) };
const expectedOptions = { cwd: '/root/dist/apps/symfony', env: expectedEnv, stdio: 'inherit' };
const expectedProdOptions = {
  cwd: '/root/dist/apps/symfony',
  env: { APP_ENV: 'prod', ...expectedEnv },
  stdio: 'inherit',
};
const expectedCopyOptions = { recursive: true, filter: expect.any(Function) };

let options: BuildExecutorSchema;
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

describe('Build Executor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can build plain PHP', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/dist/apps/symfony');
    jest.spyOn(fs, 'cpSync').mockReturnValue();

    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts`,
      expectedOptions
    );
    expect(cp.execSync).toHaveBeenCalledWith(`composer dump-autoload -a -o`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can build dev', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => path === '/root/dist/apps/symfony/bin/console' || path === '/root/dist/apps/symfony'
      );
    jest.spyOn(fs, 'cpSync').mockReturnValue();

    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(3);
    expect(cp.execSync).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts`,
      expectedOptions
    );
    expect(cp.execSync).toHaveBeenCalledWith(`composer dump-autoload -a -o`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(
      `php bin/console assets:install --relative public --no-interaction`,
      expectedOptions
    );
    expect(output.success).toBe(true);
  });

  it('can build prod', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => path === '/root/dist/apps/symfony/bin/console' || path === '/root/dist/apps/symfony'
      );
    jest.spyOn(fs, 'cpSync').mockReturnValue();

    context.configurationName = 'production';
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(3);
    expect(cp.execSync).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts --no-dev`,
      expectedProdOptions
    );
    expect(cp.execSync).toHaveBeenCalledWith(`composer dump-autoload -a -o --no-dev`, expectedProdOptions);
    expect(cp.execSync).toHaveBeenCalledWith(
      `php bin/console assets:install public --no-interaction`,
      expectedProdOptions
    );
    expect(output.success).toBe(true);
  });

  it('can clean var after build', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation((path) => path === '/root/dist/apps/var/' || path === '/root/dist/apps/symfony');
    jest.spyOn(fs, 'cpSync').mockReturnValue();

    context.configurationName = 'production';
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts --no-dev`,
      expectedProdOptions
    );
    expect(cp.execSync).toHaveBeenCalledWith(`composer dump-autoload -a -o --no-dev`, expectedProdOptions);
    expect(output.success).toBe(true);
  });

  it('can build prod to outputPath', async () => {
    const spyOnExists = jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/out/bin/console');
    const spyOnRemove = jest.spyOn(fs, 'rmSync').mockReturnValue();
    const spyOnMkdir = jest.spyOn(fs, 'mkdirSync').mockReturnValue('/root');
    const spyOnCopy = jest.spyOn(fs, 'cpSync').mockReturnValue();

    context.configurationName = 'production';
    options.outputPath = 'out';
    expectedProdOptions.cwd = '/root/out';
    const output = await executor(options, context);

    expect(spyOnRemove).not.toHaveBeenCalled();
    expect(spyOnExists).toHaveBeenCalledTimes(3);
    expect(spyOnExists).toHaveBeenCalledWith('/root/out');
    expect(spyOnExists).toHaveBeenCalledWith('/root/out/bin/console');
    expect(spyOnExists).toHaveBeenCalledWith('/root/out/var/');
    expect(spyOnMkdir).toHaveBeenCalledTimes(1);
    expect(spyOnMkdir).toHaveBeenCalledWith('/root/out', { recursive: true });
    expect(spyOnCopy).toHaveBeenCalledTimes(1);
    expect(spyOnCopy).toHaveBeenCalledWith('/root/apps/symfony/', '/root/out/', expectedCopyOptions);

    expect(cp.execSync).toHaveBeenCalledTimes(3);
    expect(cp.execSync).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts --no-dev`,
      expectedProdOptions
    );
    expect(cp.execSync).toHaveBeenCalledWith(`composer dump-autoload -a -o --no-dev`, expectedProdOptions);
    expect(cp.execSync).toHaveBeenCalledWith(
      `php bin/console assets:install public --no-interaction`,
      expectedProdOptions
    );
    expect(output.success).toBe(true);
  });

  it('can clean outputPath before building', async () => {
    const spyOnRemove = jest.spyOn(fs, 'rmSync').mockReturnValue();
    const spyOnCopy = jest.spyOn(fs, 'cpSync').mockReturnValue();
    const spyOnExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);

    context.configurationName = 'production';
    options.outputPath = 'out';
    options.cleanDestinationDir = true;
    expectedProdOptions.cwd = '/root/out';
    const output = await executor(options, context);

    expect(spyOnExists).toHaveBeenCalledTimes(4);
    expect(spyOnExists).toHaveBeenCalledWith('/root/out');
    expect(spyOnExists).toHaveBeenCalledWith('/root/out/bin/console');
    expect(spyOnExists).toHaveBeenCalledWith('/root/out/var/');

    expect(spyOnRemove).toHaveBeenCalledTimes(2);
    expect(spyOnRemove).toHaveBeenCalledWith('/root/out', { recursive: true, force: true });
    expect(spyOnRemove).toHaveBeenCalledWith('/root/out/var', { recursive: true, force: true });
    expect(spyOnCopy).toHaveBeenCalledTimes(1);
    expect(spyOnCopy).toHaveBeenCalledWith('/root/apps/symfony/', '/root/out/', expectedCopyOptions);
    expect(output.success).toBe(true);
  });
});
