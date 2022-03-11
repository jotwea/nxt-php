import { BuildExecutorSchema } from './schema';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';

export default async function runExecutor(
  options: BuildExecutorSchema,
  context: ExecutorContext
) {
  const cwd = `${context.cwd}/${
    context.workspace.projects[context.projectName].root
  }`;
  const devParams =
    context.configurationName === 'production' ? ' --no-dev' : '';

  let installParams =
    '--prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts';
  if (context.isVerbose) {
    installParams += ' --verbose';
  }

  console.info('Install using composer.');
  await promisify(exec)(`composer install ${installParams}${devParams}`, {
    cwd,
  });
  await promisify(exec)(`composer dump-autoload -a -o${devParams}`, { cwd });
  await promisify(exec)(
    `bin/console assets:install --relative public --no-interaction`,
    { cwd }
  );

  return { success: true };
}
