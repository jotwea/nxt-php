import { LintExecutorSchema } from './schema';
import { getCwd, getExecutorOptions } from '../utils/executor-utils';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { ExecutorContext } from '@nrwl/devkit';

export default async function runExecutor(options: LintExecutorSchema, context: ExecutorContext) {
  const cwd = getCwd(context);
  let lintParams = [];
  if (context.isVerbose) {
    lintParams = ['--verbose'];
  }

  const relevantDirectories = readdirSync(cwd, { withFileTypes: true })
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name)
    .filter((name) => name !== 'var' && name !== 'vendor');

  if (existsSync(`${cwd}/vendor/bin/parallel-lint`)) {
    console.info('Linting PHP...');
    execSync(
      `php vendor/bin/parallel-lint --colors ${relevantDirectories.join(' ')} ${lintParams.join(' ')}`.trim(),
      getExecutorOptions(context)
    );
  }

  console.info('Linting container...');
  execSync(`php bin/console lint:container ${lintParams.join(' ')}`.trim(), getExecutorOptions(context));

  if (existsSync(`${cwd}/vendor/symfony/yaml`)) {
    console.info('Linting YAML...');
    execSync(
      `php bin/console lint:yaml --parse-tags ${relevantDirectories.join(' ')} ${lintParams.join(' ')}`.trim(),
      getExecutorOptions(context)
    );
  }

  if (existsSync(`${cwd}/vendor/symfony/twig-bundle`)) {
    console.info('Linting Twig...');
    execSync(
      `php bin/console lint:twig --show-deprecations ${relevantDirectories.join(' ')} ${lintParams.join(' ')}`.trim(),
      getExecutorOptions(context)
    );
  }

  if (existsSync(`${cwd}/vendor/doctrine/doctrine-bundle`)) {
    console.info('Linting Doctrine schema...');
    execSync(`php bin/console doctrine:schema:validate --skip-sync`, getExecutorOptions(context));
  }

  console.info('Done Linting.');

  return { success: true };
}
