import { E2ETestExecutorSchema } from './schema';
import { execSync } from 'child_process';
import { getCwd, getExecutorOptions } from '../utils/executor-utils';
import { ExecutorContext } from '@nx/devkit';
import { existsSync } from 'fs';

export default async function runExecutor(options: E2ETestExecutorSchema, context: ExecutorContext) {
  const e2eTestDir = `${getCwd(context)}/tests_e2e`;
  if (!existsSync(e2eTestDir)) {
    console.info(`Skipped E2E Tests: Directory "${e2eTestDir}" does not exist.`);
    return { success: true };
  }

  let phpParams = [];
  let phpUnitParams = [];
  if (options.codeCoverage) {
    phpParams = [...phpParams, '-dpcov.enabled=1', '-dpcov.directory="src"', '-dpcov.exclude="~vendor~"'];
    phpUnitParams = [...phpUnitParams, '--coverage-text'];
  }
  if (options.ci) {
    phpUnitParams = [...phpUnitParams, '--log-junit phpunit-report.xml', '--coverage-cobertura cobertura-coverage.xml'];
  }
  if (context.isVerbose) {
    phpUnitParams = [...phpUnitParams, '--verbose'];
  }

  const executor = options.processes > 1 ? `paratest -p${options.processes}` : 'phpunit';
  console.info(`E2E Testing using ${executor}...`);
  execSync(
    `php ${phpParams.join(' ')} vendor/bin/${executor} tests_e2e ${phpUnitParams.join(' ')}`.trim(),
    getExecutorOptions(context),
  );
  console.info('Done E2E testing.');

  return { success: true };
}
