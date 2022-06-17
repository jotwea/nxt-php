import { execSync, ExecSyncOptions } from 'child_process';
import { ExecutorContext } from '@nrwl/devkit';

export function getProjectPath(context: ExecutorContext): string {
  return context.workspace.projects[context.projectName].root;
}

export function getCwd(context: ExecutorContext): string {
  return `${context.cwd}/${getProjectPath(context)}`;
}

export function getEnv(): NodeJS.ProcessEnv {
  return {
    PHP_INI_DIR: process.env.PHP_INI_DIR || '',
    HOME: process.env.HOME || '',
    PATH: process.env.PATH || '',
  };
}

export function getExecutorOptions(context: ExecutorContext): ExecSyncOptions {
  const env = getEnv();
  if (context.configurationName === 'production') env.APP_ENV = 'prod';
  return { cwd: getCwd(context), stdio: 'inherit', env };
}

export function composerInstall(context: ExecutorContext) {
  const installParams = ['--prefer-dist', '--no-progress', '--no-interaction', '--optimize-autoloader', '--no-scripts'];
  if (context.configurationName === 'production') {
    installParams.push('--no-dev');
  }
  if (context.isVerbose) {
    installParams.push('-vvv');
  }

  console.info('Installing using composer...');
  execSync(`composer install ${installParams.join(' ')}`.trim(), getExecutorOptions(context));
  console.info('Done installing using composer.');
}
