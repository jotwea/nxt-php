import { ExecutorContext } from '@nx/devkit';
import { LintExecutorSchema } from './schema';
import executor from './executor';

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}));
import * as cp from 'child_process';

describe('Lint Executor', () => {
  const expectedEnv = {
    HOME: expect.any(String),
    PATH: expect.any(String),
    PHP_INI_DIR: expect.any(String),
    COMPOSER_HOME: expect.any(String),
    APPDATA: expect.any(String),
  };
  const expectedOptions = { cwd: '/root/apps/symfony', env: expectedEnv, stdio: 'inherit' };

  let options: LintExecutorSchema;
  let context: ExecutorContext;

  beforeEach(() => {
    options = {};
    context = {
      root: '/root',
      cwd: '/root',
      projectName: 'my-app',
      targetName: 'lint',
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

  it('runs composer run lint by default', async () => {
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith('composer run lint', expectedOptions);
    expect(output.success).toBe(true);
  });

  it('runs composer run lint-ci and redirects output when outputFile is set', async () => {
    options.outputFile = 'gl-code-quality.json';
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(
      'composer run lint-ci > gl-code-quality.json 2>/dev/null',
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('returns success when lint script is not defined in composer.json', async () => {
    (cp.execSync as jest.Mock).mockImplementation(() => {
      const err = new Error("Script 'lint' not defined in this package");
      throw err;
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
  });

  it('returns success when lint-ci script is not defined in composer.json', async () => {
    options.outputFile = 'gl-code-quality.json';
    (cp.execSync as jest.Mock).mockImplementation(() => {
      const err = new Error("Script 'lint-ci' not defined in this package");
      throw err;
    });

    const output = await executor(options, context);

    expect(output.success).toBe(true);
  });

  it('returns failure when lint script exits with a real error', async () => {
    (cp.execSync as jest.Mock).mockImplementation(() => {
      throw new Error('Command failed: composer run lint');
    });

    const output = await executor(options, context);

    expect(output.success).toBe(false);
  });
});
