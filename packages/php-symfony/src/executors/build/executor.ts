import { BuildExecutorSchema } from './schema';
import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  const cwd = `${context.cwd}/${context.workspace.projects[context.projectName].root}`;
  const envPrefix = context.configurationName === 'production' ? 'APP_ENV=prod ' : '';
  const devParams = context.configurationName === 'production' ? ' --no-dev' : '';
  let installParams = '--prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts';
  if (context.isVerbose) {
    installParams += ' --verbose';
  }

  console.info('Installing using composer...');
  const execOptions = { cwd, env: {} }
  await promisify(exec)(`composer install ${installParams}${devParams}`, execOptions);
  await promisify(exec)(`composer dump-autoload -a -o${devParams}`, execOptions);
  await promisify(exec)(`${envPrefix}php bin/console assets:install --relative public --no-interaction`, execOptions);
  console.info('Done installing using composer.');

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
    fs.cpSync(`${cwd}/`, `${dest}/`, { recursive: true });
    console.info(`Done copying files.`);
  }

  return { success: true };
}
