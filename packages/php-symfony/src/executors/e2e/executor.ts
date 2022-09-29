import { E2ETestExecutorSchema } from './schema';
import { execSync } from 'child_process';
import { composerInstall, getExecutorOptions } from '../utils/executor-utils';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync } from 'fs';

export default async function runExecutor(options: E2ETestExecutorSchema, context: ExecutorContext) {
  const e2eTestDir = `${context.cwd}/tests_e2e`;
  if (!existsSync(e2eTestDir)) {
    console.info('Skipped E2E Tests: Directory "/tests_e2e" does not exist.');
    return { success: true };
  }

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

  console.info('E2E Testing using phpunit...');
  execSync(
    `php ${phpParams.join(' ')} vendor/bin/phpunit tests_e2e ${phpUnitParams.join(' ')}`.trim(),
    getExecutorOptions(context)
  );
  console.info('Done E2E testing.');

  return { success: true };
}
