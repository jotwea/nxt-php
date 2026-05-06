import { LintExecutorSchema } from './schema';
import { getCwd, getEnv } from '../utils/executor-utils';
import { execSync } from 'child_process';
import { ExecutorContext } from '@nx/devkit';

export default async function runExecutor(options: LintExecutorSchema, context: ExecutorContext) {
  const cwd = getCwd(context);
  const scriptName = options.outputFile ? 'lint-ci' : 'lint';
  const env = { ...getEnv() };

  const cmd = options.outputFile
    ? `composer run ${scriptName} > ${options.outputFile} 2>/dev/null`
    : `composer run ${scriptName}`;

  try {
    execSync(cmd, { cwd, env, stdio: 'inherit' });
  } catch (e) {
    const msg: string = (e as Error).message ?? '';
    // Composer exits non-zero with "Script ... not defined" when the script is missing
    if (msg.includes('Script') && msg.includes('not defined')) {
      return { success: true };
    }
    return { success: false };
  }

  return { success: true };
}
