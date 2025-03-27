import { TestExecutorSchema } from './schema';
import { execSync } from 'child_process';
import { getExecutorOptions } from '../utils/executor-utils';
import { ExecutorContext } from '@nx/devkit';

export default async function runExecutor(options: TestExecutorSchema, context: ExecutorContext) {
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
  console.info(`Testing using ${executor}...`);
  execSync(
    `php ${phpParams.join(' ')} vendor/bin/${executor} ${phpUnitParams.join(' ')}`.trim(),
    getExecutorOptions(context),
  );
  console.info('Done testing.');

  return { success: true };
}
