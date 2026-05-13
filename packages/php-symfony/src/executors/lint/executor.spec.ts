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

  describe('without outputFile', () => {
    it('runs composer run lint', async () => {
      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(1);
      expect(cp.execSync).toHaveBeenCalledWith('composer run lint', expectedOptions);
      expect(output.success).toBe(true);
    });

    it('returns success when lint script is not defined in composer.json', async () => {
      (cp.execSync as jest.Mock).mockImplementation(() => {
        throw new Error("Script 'lint' not defined in this package");
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

  describe('with outputFile and reportScripts', () => {
    beforeEach(() => {
      options.outputFile = 'gl.json';
      options.reportScripts = [
        { script: 'lint-cs-ci', suffix: 'cs-fixer' },
        { script: 'phpstan-ci', suffix: 'phpstan' },
      ];
    });

    it('runs lint-static first, then each report script with a derived output path', async () => {
      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(3);
      expect(cp.execSync).toHaveBeenNthCalledWith(1, 'composer run lint-static', expectedOptions);
      expect(cp.execSync).toHaveBeenNthCalledWith(
        2,
        'composer run lint-cs-ci > gl-cs-fixer.json 2>/dev/null',
        expectedOptions,
      );
      expect(cp.execSync).toHaveBeenNthCalledWith(
        3,
        'composer run phpstan-ci > gl-phpstan.json 2>/dev/null',
        expectedOptions,
      );
      expect(output.success).toBe(true);
    });

    it('derives report filenames correctly for nested paths', async () => {
      options.outputFile = 'reports/gl.json';

      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenNthCalledWith(
        2,
        'composer run lint-cs-ci > reports/gl-cs-fixer.json 2>/dev/null',
        expectedOptions,
      );
      expect(cp.execSync).toHaveBeenNthCalledWith(
        3,
        'composer run phpstan-ci > reports/gl-phpstan.json 2>/dev/null',
        expectedOptions,
      );
      expect(output.success).toBe(true);
    });

    it('aborts after lint-static failure without running report scripts', async () => {
      (cp.execSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Command failed: composer run lint-static');
      });

      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(1);
      expect(output.success).toBe(false);
    });

    it('returns failure when a report script exits with a real error', async () => {
      (cp.execSync as jest.Mock)
        .mockImplementationOnce(() => undefined) // lint-static ok
        .mockImplementationOnce(() => {
          throw new Error('Command failed: composer run lint-cs-ci');
        });

      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(2);
      expect(output.success).toBe(false);
    });

    it('returns success when lint-static is not defined in composer.json', async () => {
      (cp.execSync as jest.Mock)
        .mockImplementationOnce(() => {
          throw new Error("Script 'lint-static' not defined in this package");
        })
        .mockImplementation(() => undefined);

      const output = await executor(options, context);

      // lint-static treated as success -> report scripts still run
      expect(cp.execSync).toHaveBeenCalledTimes(3);
      expect(output.success).toBe(true);
    });

    it('returns success when a report script is not defined in composer.json', async () => {
      (cp.execSync as jest.Mock)
        .mockImplementationOnce(() => undefined) // lint-static ok
        .mockImplementationOnce(() => {
          throw new Error("Script 'lint-cs-ci' not defined in this package");
        })
        .mockImplementationOnce(() => undefined); // phpstan-ci ok

      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(3);
      expect(output.success).toBe(true);
    });

    it('runs only lint-static when reportScripts is empty', async () => {
      options.reportScripts = [];

      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(1);
      expect(cp.execSync).toHaveBeenCalledWith('composer run lint-static', expectedOptions);
      expect(output.success).toBe(true);
    });

    it('runs only lint-static when reportScripts is not set', async () => {
      delete options.reportScripts;

      const output = await executor(options, context);

      expect(cp.execSync).toHaveBeenCalledTimes(1);
      expect(cp.execSync).toHaveBeenCalledWith('composer run lint-static', expectedOptions);
      expect(output.success).toBe(true);
    });
  });
});
