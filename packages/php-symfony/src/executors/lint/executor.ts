import { LintExecutorSchema } from './schema';
import { getCwd, getEnv } from '../utils/executor-utils';
import * as childProcess from 'child_process';
import { ExecutorContext } from '@nx/devkit';

function buildReportFilePath(outputFile: string, suffix: string): string {
  const parts = outputFile.split('.');
  const ext = parts.pop();
  return `${parts.join('.')}-${suffix}.${ext}`;
}

function runComposerScript(script: string, cwd: string, env: NodeJS.ProcessEnv, redirect?: string): boolean {
  const cmd = redirect ? `composer run ${script} > ${redirect} 2>/dev/null` : `composer run ${script}`;

  try {
    childProcess.execSync(cmd, { cwd, env, stdio: 'inherit' });
    return true;
  } catch (e) {
    const msg: string = (e as Error).message ?? '';
    if (msg.includes('Script') && msg.includes('not defined')) {
      return true;
    }
    return false;
  }
}

export default async function runExecutor(options: LintExecutorSchema, context: ExecutorContext) {
  const cwd = getCwd(context);
  const env = { ...getEnv() };

  if (!options.outputFile) {
    const success = runComposerScript('lint', cwd, env);
    return { success };
  }

  const staticOk = runComposerScript('lint-static', cwd, env);
  if (!staticOk) {
    return { success: false };
  }

  for (const { script, suffix } of options.reportScripts ?? []) {
    const redirect = buildReportFilePath(options.outputFile, suffix);
    const ok = runComposerScript(script, cwd, env, redirect);
    if (!ok) {
      return { success: false };
    }
  }

  return { success: true };
}
