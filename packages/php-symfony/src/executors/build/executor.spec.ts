import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';
import { BuildExecutorSchema } from './schema';
import executor from './executor';
import * as cp from 'child_process';

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

describe('Build Executor', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('can build dev', async () => {
    const output = await executor(options, context);

    expect(cp.exec).toHaveBeenCalledTimes(3);
    expect(cp.exec).toHaveBeenCalledWith(
      `composer install --prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts`,
      { cwd: '/root/apps/symfony' },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `composer dump-autoload -a -o`,
      { cwd: '/root/apps/symfony' },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `bin/console assets:install --relative public --no-interaction`,
      { cwd: '/root/apps/symfony' },
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
      { cwd: '/root/apps/symfony' },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `composer dump-autoload -a -o --no-dev`,
      { cwd: '/root/apps/symfony' },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `bin/console assets:install --relative public --no-interaction`,
      { cwd: '/root/apps/symfony' },
      expect.any(Function)
    );
    expect(output.success).toBe(true);
  });
});
