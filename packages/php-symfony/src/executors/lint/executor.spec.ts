import { ExecutorContext } from '@nx/devkit';
import { LintExecutorSchema } from './schema';
import executor from './executor';

// mock exec of child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    if (callback) callback(null, { stdout: '' });
  }),
  execSync: jest.fn((command, options, callback) => {
    if (callback) callback(null, { stdout: '' });
  }),
}));
import * as cp from 'child_process';

jest.mock('fs', () => ({
  readdirSync: jest.fn(() => [
    { name: 'project.json', isDirectory: () => false },
    { name: 'config', isDirectory: () => true },
    { name: 'src', isDirectory: () => true },
    { name: 'vendor', isDirectory: () => true },
  ]),
  existsSync: jest.fn(() => false),
}));
import * as fs from 'fs';

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
      targetName: 'build',
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
        (path) => path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/bin/parallel-lint',
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
        (path) => path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/symfony/twig-bundle',
      );
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(
      `php bin/console lint:twig --show-deprecations config src`,
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can lint [container+YAML]', async () => {
    jest
      .spyOn(fs, 'existsSync')
      .mockImplementation(
        (path) => path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/symfony/yaml',
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
          path === '/root/apps/symfony/bin/console' || path === '/root/apps/symfony/vendor/doctrine/doctrine-bundle',
      );
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(2);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console lint:container`, expectedOptions);
    expect(cp.execSync).toHaveBeenCalledWith(`php bin/console doctrine:schema:validate --skip-sync`, expectedOptions);
    expect(output.success).toBe(true);
  });

  it('can lint [PHP-CS-Fixer] with default options', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/apps/symfony/vendor/bin/php-cs-fixer');
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(
      'php vendor/bin/php-cs-fixer fix --config=php_cs_fixer.dist.php --diff --using-cache=no --dry-run',
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can lint [PHP-CS-Fixer] and ignore env', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/apps/symfony/vendor/bin/php-cs-fixer');
    options.fix = true;
    options.ignoreEnv = true;
    const expectedOptions = {
      cwd: '/root/apps/symfony',
      env: { ...expectedEnv, PHP_CS_FIXER_IGNORE_ENV: expect.any(String) },
      stdio: 'inherit',
    };

    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(
      'php vendor/bin/php-cs-fixer fix --config=php_cs_fixer.dist.php --diff --using-cache=no',
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can lint [PHP-CS-Fixer] with all options', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/apps/symfony/vendor/bin/php-cs-fixer');
    options.format = 'gitlab';
    options.outputFile = 'gl-code-quality-report.json';
    options.fix = true;

    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(
      'php vendor/bin/php-cs-fixer fix --config=php_cs_fixer.dist.php --diff --using-cache=no format=gitlab > gl-code-quality-report.json',
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can lint [PHPStan] with default options', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/apps/symfony/vendor/bin/phpstan');
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(
      'php vendor/bin/phpstan analyse --configuration=phpstan.neon --no-progress',
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can lint [PHPStan] with all options', async () => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => path === '/root/apps/symfony/vendor/bin/phpstan');
    options.format = 'gitlab';
    options.outputFile = 'gl-code-quality-report.json';
    options.fix = true;

    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(1);
    expect(cp.execSync).toHaveBeenCalledWith(
      'php vendor/bin/phpstan analyse --configuration=phpstan.neon --no-progress error-format=gitlab > gl-code-quality-report.json',
      expectedOptions,
    );
    expect(output.success).toBe(true);
  });

  it('can lint all components', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const output = await executor(options, context);

    expect(cp.execSync).toHaveBeenCalledTimes(7);
    expect(output.success).toBe(true);
  });
});
