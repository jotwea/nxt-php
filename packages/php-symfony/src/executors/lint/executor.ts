import { LintExecutorSchema } from './schema';
import { getCwd, getEnv } from '../utils/executor-utils';
import { execSync } from 'child_process';
import { ExecutorContext } from '@nx/devkit';

function buildReportFilePath(outputFile: string, suffix: string): string {
  const parts = outputFile.split('.');
  const ext = parts.pop();
  return `${parts.join('.')}-${suffix}.${ext}`;
}

function runComposerScript(script: string, cwd: string, env: NodeJS.ProcessEnv, redirect?: string): boolean {
  const cmd = redirect
    ? `composer run ${script} > ${redirect} 2>/dev/null`
    : `composer run ${script}`;

  try {
    execSync(cmd, { cwd, env, stdio: 'inherit' });
    return true;
  } catch (e) {
    const msg: string = (e as Error).message ?? '';
    // Composer exits non-zero with "Script ... not defined" when the script is missing
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

  // Run the static checks first (no report output); abort on failure.
  const staticSuccess = runComposerScript('lint-static', cwd, env);
  if (!staticSuccess) {
    return { success: false };
  }

  // Run each report-producing script and redirect its output to a derived filename.
  const reportScripts = options.reportScripts ?? [];
  for (const { script, suffix } of reportScripts) {
    const reportFile = buildReportFilePath(options.outputFile, suffix);
    const success = runComposerScript(script, cwd, env, reportFile);
    if (!success) {
      return { success: false };
    }
  }

  return { success: true };
}
