import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';
import { BuildExecutorSchema } from './schema';
import executor from './executor';

// mock exec of child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    callback(null, { stdout: '' });
  }),
}));
import * as cp from 'child_process';

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
  it('can run', async () => {
    const output = await executor(options, context);

    expect(cp.exec).toHaveBeenCalledWith(
      `composer install`,
      { cwd: '/root/apps/symfony' },
      expect.any(Function)
    );
    expect(output.success).toBe(true);
  });
});
