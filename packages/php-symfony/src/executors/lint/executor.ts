import { LintExecutorSchema } from './schema';
import { getCwd, getExecutorOptions } from '../utils/executor-utils';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { ExecutorContext } from '@nx/devkit';

export default async function runExecutor(options: LintExecutorSchema, context: ExecutorContext) {
  const cwd = getCwd(context);
  const commonParams = context.isVerbose ? '--verbose' : '';

  const relevantDirectories = readdirSync(cwd, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)
    .filter((name) => name !== 'var' && name !== 'vendor');

  if (existsSync(`${cwd}/vendor/bin/parallel-lint`)) {
    console.info('Linting PHP...');
    execSync(
      `php vendor/bin/parallel-lint --colors ${relevantDirectories.join(' ')} ${commonParams}`.trim(),
      getExecutorOptions(context),
    );
  }

  if (existsSync(`${cwd}/vendor/bin/php-cs-fixer`)) {
    console.info('Linting using PHP-CS-Fixer...');

    const executorOptions = getExecutorOptions(context);
    if (options.ignoreEnv) {
      executorOptions.env.PHP_CS_FIXER_IGNORE_ENV = '1';
    }
    let lintParams = options.format ? ` format=${options.format}` : '';
    if (!options.fix) {
      lintParams += ' --dry-run';
    }
    lintParams += commonParams;
    if (options.outputFile) {
      lintParams += ` > ${options.outputFile}`;
    }

    execSync(
      `php vendor/bin/php-cs-fixer fix --config=php_cs_fixer.dist.php --diff --using-cache=no${lintParams}`.trim(),
      executorOptions,
    );
  }

  if (existsSync(`${cwd}/vendor/bin/phpstan`)) {
    console.info('Linting using PHPStan...');

    let lintParams = options.format ? `error-format=${options.format}` : '';
    lintParams += commonParams;
    if (options.outputFile) {
      lintParams += ` > ${options.outputFile}`;
    }
    execSync(
      `php vendor/bin/phpstan analyse --configuration=phpstan.neon --no-progress ${lintParams}`.trim(),
      getExecutorOptions(context),
    );
  }

  if (existsSync(`${cwd}/bin/console`)) {
    console.info('Linting container...');
    execSync(`php bin/console lint:container ${commonParams}`.trim(), getExecutorOptions(context));

    if (existsSync(`${cwd}/vendor/symfony/yaml`)) {
      console.info('Linting YAML...');
      execSync(
        `php bin/console lint:yaml --parse-tags ${relevantDirectories.join(' ')} ${commonParams}`.trim(),
        getExecutorOptions(context),
      );
    }

    if (existsSync(`${cwd}/vendor/symfony/twig-bundle`)) {
      console.info('Linting Twig...');
      execSync(
        `php bin/console lint:twig --show-deprecations ${relevantDirectories.join(' ')} ${commonParams}`.trim(),
        getExecutorOptions(context),
      );
    }

    if (existsSync(`${cwd}/vendor/doctrine/doctrine-bundle`)) {
      console.info('Linting Doctrine schema...');
      execSync(`php bin/console doctrine:schema:validate --skip-sync`, getExecutorOptions(context));
    }
  }

  console.info('Done Linting.');

  return { success: true };
}
