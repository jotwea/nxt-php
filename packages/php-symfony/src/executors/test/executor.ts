import { TestExecutorSchema } from './schema';
import { execSync } from "child_process";
import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';

export default async function runExecutor(options: TestExecutorSchema, context: ExecutorContext) {
  const cwd = `${context.cwd}/${context.workspace.projects[context.projectName].root}`;
  let installParams = ['--prefer-dist', '--no-progress', '--no-interaction', '--optimize-autoloader', '--no-scripts'];
  let phpParams = [];
  let phpUnitParams = [];
  if (options.codeCoverage) {
    phpParams = [...phpParams, '-dpcov.enabled=1', '-dpcov.directory="src"', '-dpcov.exclude="~vendor~"'];
    phpUnitParams = [...phpUnitParams, '--coverage-text'];
  }
  if (options.ci) {
    phpUnitParams =  [...phpUnitParams, '--log-junit phpunit-report.xml'];
  }
  if (context.isVerbose) {
    installParams = [...installParams, '-vvv'];
    phpUnitParams = [...phpUnitParams, '--verbose'];
  }

  const phpEnv = {
    PHP_INI_DIR: process.env.PHP_INI_DIR || '',
    HOME: process.env.HOME || '',
    PATH:  process.env.PATH || '',
  }

  console.info('Installing using composer...');
  execSync(`composer install ${installParams.join(' ')}`.trim(), { cwd, stdio: 'inherit', env: phpEnv });
  console.info('Done installing using composer.');

  console.info('Testing using phpunit...');
  execSync(`php ${phpParams.join(' ')} vendor/bin/phpunit ${phpUnitParams.join(' ')}`.trim(), { cwd, stdio: 'inherit', env: phpEnv });
  console.info('Done testing.');

  return { success: true };
}
