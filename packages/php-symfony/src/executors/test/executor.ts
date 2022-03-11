import { TestExecutorSchema } from './schema';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';

export default async function runExecutor(options: TestExecutorSchema, context: ExecutorContext) {
  const cwd = `${context.cwd}/${context.workspace.projects[context.projectName].root}`;

  console.info('Test using phpunit');
  await promisify(exec)(`bin/phpunit`, { cwd });

  return { success: true };
}
