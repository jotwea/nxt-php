import { BuildExecutorSchema } from './schema';
import * as fs from 'fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ExecutorContext } from '@nrwl/tao/src/shared/workspace';

export default async function runExecutor(options: BuildExecutorSchema, context: ExecutorContext) {
  let cwd = `${context.cwd}/${context.workspace.projects[context.projectName].root}`;
  if (options.outputPath) {
    console.info(`Copying files to output path "${options.outputPath}"...`);
    const dest = `${context.cwd}/${options.outputPath}/`;

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    await fs.cp(`${cwd}/`, `${dest}/`, { recursive: true }, (err) => {
      if (err) throw err;
      console.info(`Done copying files to output path "${options.outputPath}".`);
    });

    cwd = dest;
  }

  const devParams = context.configurationName === 'production' ? ' --no-dev' : '';
  let installParams = '--prefer-dist --no-progress --no-interaction --optimize-autoloader --no-scripts';
  if (context.isVerbose) {
    installParams += ' --verbose';
  }

  console.info('Installing using composer...');
  await promisify(exec)(`composer install ${installParams}${devParams}`, { cwd });
  await promisify(exec)(`composer dump-autoload -a -o${devParams}`, { cwd });
  await promisify(exec)(`bin/console assets:install --relative public --no-interaction`, { cwd });
  console.info('Done installing using composer.');

  return { success: true };
}
