import { ExecSyncOptions } from 'child_process';
import { ExecutorContext } from '@nx/devkit';

export function getProjectPath(context: ExecutorContext): string {
  return context.projectsConfigurations.projects[context.projectName].root;
}

export function getCwd(context: ExecutorContext): string {
  return `${context.cwd}/${getProjectPath(context)}`;
}

export function getEnv(): NodeJS.ProcessEnv {
  return {
    PHP_INI_DIR: process.env.PHP_INI_DIR || '',
    HOME: process.env.HOME || '',
    PATH: process.env.PATH || '',
    COMPOSER_HOME: process.env.COMPOSER_HOME || '',
    APPDATA: process.env.APPDATA || '',
  };
}

export function getExecutorOptions(context: ExecutorContext): ExecSyncOptions {
  const env = getEnv();
  if (context.configurationName === 'production') env.APP_ENV = 'prod';
  return { cwd: getCwd(context), stdio: 'inherit', env };
}
