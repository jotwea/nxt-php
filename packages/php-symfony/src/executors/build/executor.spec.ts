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
const expectedOptions = { cwd: '/root/apps/symfony', env: expectedEnv, stdio: 'inherit' };
const expectedProdOptions = { cwd: '/root/apps/symfony', env: { APP_ENV: 'prod', ...expectedEnv }, stdio: 'inherit' };

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

  it('can build dev', async () => {
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

  it('can build prod to outputPath', async () => {
    const spyOnRemove = jest.spyOn(fs, 'rmSync').mockReturnValue();
    const spyOnExists = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const spyOnMkdir = jest.spyOn(fs, 'mkdirSync').mockReturnValue('/root');
    const spyOnCopy = jest.spyOn(fs, 'cpSync').mockReturnValue();

    context.configurationName = 'production';
    options.outputPath = 'out/path';
    const dist = '/root/out/path';
    const output = await executor(options, context);

    expect(spyOnRemove).not.toHaveBeenCalled();
    expect(spyOnExists).toHaveBeenCalledTimes(1);
    expect(spyOnExists).toHaveBeenCalledWith(dist);
    expect(spyOnMkdir).toHaveBeenCalledTimes(1);
    expect(spyOnMkdir).toHaveBeenCalledWith(dist, { recursive: true });
    expect(spyOnCopy).toHaveBeenCalledTimes(1);
    expect(spyOnCopy).toHaveBeenCalledWith(`${expectedOptions.cwd}/`, `${dist}/`, { recursive: true });

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
    const spyOnExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const spyOnCopy = jest.spyOn(fs, 'cpSync').mockReturnValue();

    context.configurationName = 'production';
    options.outputPath = 'out/path';
    options.cleanDestinationDir = true;
    const dist = '/root/out/path';
    const output = await executor(options, context);

    expect(spyOnRemove).toHaveBeenCalledTimes(1);
    expect(spyOnRemove).toHaveBeenCalledWith(dist, { recursive: true, force: true });
    expect(spyOnExists).toHaveBeenCalledTimes(2);
    expect(spyOnCopy).toHaveBeenCalledTimes(1);
    expect(spyOnCopy).toHaveBeenCalledWith(`${expectedOptions.cwd}/`, `${dist}/`, { recursive: true });
    expect(output.success).toBe(true);
  });
});
