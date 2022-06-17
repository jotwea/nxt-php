import { TestExecutorSchema } from './schema';
import { execSync } from 'child_process';
import { composerInstall, getExecutorOptions } from '../utils/executor-utils';
import { ExecutorContext } from '@nrwl/devkit';

export default async function runExecutor(options: TestExecutorSchema, context: ExecutorContext) {
  let phpParams = [];
  let phpUnitParams = [];
  if (options.codeCoverage) {
    phpParams = [...phpParams, '-dpcov.enabled=1', '-dpcov.directory="src"', '-dpcov.exclude="~vendor~"'];
    phpUnitParams = [...phpUnitParams, '--coverage-text'];
  }
  if (options.ci) {
    phpUnitParams = [...phpUnitParams, '--log-junit phpunit-report.xml'];
  }
  if (context.isVerbose) {
    phpUnitParams = [...phpUnitParams, '--verbose'];
  }

  composerInstall(context);

  console.info('Testing using phpunit...');
  execSync(
    `php ${phpParams.join(' ')} vendor/bin/phpunit ${phpUnitParams.join(' ')}`.trim(),
    getExecutorOptions(context)
  );
  console.info('Done testing.');

  return { success: true };
}
