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
  await promisify(exec)(`composer install`, { cwd });

  return {
    success: true,
  };
}
