import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';
import * as cp from 'child_process';
import * as fs from 'fs';
import { BuildExecutorSchema } from './schema';
import executor from './executor';

// mock exec of child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    callback(null, { stdout: '' });
  }),
}));

const options: BuildExecutorSchema = {};
const context: ExecutorContext = {
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

const expectedCwd = '/root/apps/symfony';
const phpOptions = { cwd: expectedCwd, env: {} };

describe('Build Executor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can build dev', async () => {
    const output = await executor(options, context);

    expect(cp.exec).toHaveBeenCalledTimes(3);
    expect(cp.exec).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts`,
      { cwd: expectedCwd },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(`composer dump-autoload -a -o`, { cwd: expectedCwd }, expect.any(Function));
    expect(cp.exec).toHaveBeenCalledWith(
      `php bin/console assets:install --relative public --no-interaction`,
      phpOptions,
      expect.any(Function)
    );
    expect(output.success).toBe(true);
  });

  it('can build prod', async () => {
    context.configurationName = 'production';
    const output = await executor(options, context);

    expect(cp.exec).toHaveBeenCalledTimes(3);
    expect(cp.exec).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts --no-dev`,
      { cwd: expectedCwd },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `composer dump-autoload -a -o --no-dev`,
      { cwd: expectedCwd },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `APP_ENV=prod php bin/console assets:install --relative public --no-interaction`,
      phpOptions,
      expect.any(Function)
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
    expect(spyOnCopy).toHaveBeenCalledWith(`${expectedCwd}/`, `${dist}/`, { recursive: true });

    expect(cp.exec).toHaveBeenCalledTimes(3);
    expect(cp.exec).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts --no-dev`,
      { cwd: expectedCwd },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `composer dump-autoload -a -o --no-dev`,
      { cwd: expectedCwd },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `APP_ENV=prod php bin/console assets:install --relative public --no-interaction`,
      phpOptions,
      expect.any(Function)
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
    expect(spyOnCopy).toHaveBeenCalledWith(`${expectedCwd}/`, `${dist}/`, { recursive: true });
    expect(output.success).toBe(true);
  });
});
