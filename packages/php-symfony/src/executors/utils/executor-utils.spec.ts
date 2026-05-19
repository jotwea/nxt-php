import { ExecutorContext } from '@nx/devkit';
import { getCwd, getEnv, getExecutorOptions, getProjectPath } from './executor-utils';

describe('executor-utils', () => {
  const context: ExecutorContext = {
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
        },
      },
    },
    projectGraph: { nodes: {}, dependencies: {} },
    isVerbose: false,
  };

  describe('getProjectPath', () => {
    it('returns the project root', () => {
      expect(getProjectPath(context)).toBe('apps/symfony');
    });
  });

  describe('getCwd', () => {
    it('returns the absolute project path', () => {
      expect(getCwd(context)).toBe('/root/apps/symfony');
    });
  });

  describe('getEnv', () => {
    it('returns required env keys', () => {
      const env = getEnv();
      expect(env).toHaveProperty('PHP_INI_DIR');
      expect(env).toHaveProperty('HOME');
      expect(env).toHaveProperty('PATH');
      expect(env).toHaveProperty('COMPOSER_HOME');
      expect(env).toHaveProperty('APPDATA');
    });

    it('falls back to empty string for unset env vars', () => {
      const saved = process.env.PHP_INI_DIR;
      delete process.env.PHP_INI_DIR;
      expect(getEnv().PHP_INI_DIR).toBe('');
      process.env.PHP_INI_DIR = saved;
    });
  });

  describe('getExecutorOptions', () => {
    it('returns cwd, stdio and env', () => {
      const opts = getExecutorOptions(context);
      expect(opts.cwd).toBe('/root/apps/symfony');
      expect(opts.stdio).toBe('inherit');
      expect(opts.env).toBeDefined();
    });

    it('does not set APP_ENV for non-production configurations', () => {
      const opts = getExecutorOptions(context);
      expect(opts.env?.APP_ENV).toBeUndefined();
    });

    it('sets APP_ENV=prod for production configuration', () => {
      const prodContext = { ...context, configurationName: 'production' };
      const opts = getExecutorOptions(prodContext);
      expect(opts.env?.APP_ENV).toBe('prod');
    });
  });
});
