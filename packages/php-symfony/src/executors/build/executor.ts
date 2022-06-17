import { BuildExecutorSchema } from './schema';
import * as fs from 'fs';
import { composerInstall, getExecutorOptions } from '../utils/executor-utils';
import { execSync } from 'child_process';
import { ExecutorContext } from '@nrwl/devkit';

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  const executorContext = getExecutorOptions(context);
  const devParams = context.configurationName === 'production' ? ' --no-dev' : '';

  console.info('Building ...');
  composerInstall(context);
  execSync(`composer dump-autoload -a -o${devParams}`, executorContext);
  execSync(`php bin/console assets:install --relative public --no-interaction`, executorContext);
  console.info('Done building.');

  if (options.outputPath) {
    const dest = `${context.cwd}/${options.outputPath}`;

    if (options.cleanDestinationDir && fs.existsSync(dest)) {
      console.info(`Clean directory.`);
      fs.rmSync(dest, { recursive: true, force: true });
    }

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    console.info(`Copying files to output path "${options.outputPath}"...`);
    fs.cpSync(`${executorContext.cwd}/`, `${dest}/`, { recursive: true });
    console.info(`Done copying files.`);
  }

  return { success: true };
}
