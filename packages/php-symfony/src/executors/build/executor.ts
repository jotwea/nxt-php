import { BuildExecutorSchema } from './schema';
import * as fs from 'fs';
import { getExecutorOptions, getProjectPath } from '../utils/executor-utils';
import { execSync } from 'child_process';
import { ExecutorContext } from '@nrwl/devkit';
import { existsSync } from 'fs';

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  const destination = options.outputPath
    ? `${context.cwd}/${options.outputPath}`
    : `${context.cwd}/dist/${getProjectPath(context)}`;

  console.info('Building ...');
  prepare(destination, options.cleanDestinationDir);
  copy(`${getExecutorOptions(context).cwd}`, destination);
  build(context, destination);
  console.info('Done building.');

  return { success: true };
}

function prepare(destination: string, clean: boolean): void {
  if (clean && fs.existsSync(destination)) {
    console.info('Clean directory.');
    fs.rmSync(destination, { recursive: true, force: true });
  }

  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
}

function copy(source: string, destination: string): void {
  console.info(`Copy sources to "${destination}".`);
  const exclude = [`${source}/tests`, `${source}/tests_e2e`, `${source}/var`, `${source}/vendor`];
  const filter = (source: string) => !exclude.includes(source);
  fs.cpSync(`${source}/`, `${destination}/`, { recursive: true, filter });
}

function build(context: ExecutorContext, destination: string): void {
  const executorOptions = { ...getExecutorOptions(context), cwd: destination };
  const installParams = ['--prefer-dist', '--no-progress', '--no-interaction', '--optimize-autoloader', '--no-scripts'];
  if (context.configurationName === 'production') {
    installParams.push('--no-dev');
  }
  if (context.isVerbose) {
    installParams.push('-vvv');
  }
  const devParams = context.configurationName === 'production' ? ' --no-dev' : '';
  const assetParams = context.configurationName === 'production' ? '' : ' --relative';

  execSync(`composer install ${installParams.join(' ')}`.trim(), executorOptions);
  execSync(`composer dump-autoload -a -o${devParams}`, executorOptions);
  if (existsSync(`${destination}/bin/console`)) {
    execSync(`php bin/console assets:install${assetParams} public --no-interaction`, executorOptions);
  }
  if (fs.existsSync(`${destination}/var/`)) {
    fs.rmSync(`${destination}/var`, { recursive: true, force: true });
  }
}
