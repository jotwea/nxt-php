import { addProjectConfiguration, formatFiles, Tree } from '@nx/devkit';
import { PhpSymfonyGeneratorSchema } from './schema';
import { promisify } from 'util';
import { exec } from 'child_process';
import { defaultLintOptions, normalizeOptions } from '../utils/generator-utils';

export default async function (tree: Tree, options: PhpSymfonyGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options, 'appsDir');
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nxt-php/php-symfony:build',
        options: {
          outputPath: `dist/${normalizedOptions.projectRoot}`,
          cleanDestinationDir: true,
        },
        configurations: {
          production: {},
        },
      },
      e2e: {
        executor: '@nxt-php/php-symfony:e2e',
      },
      lint: {
        executor: '@nxt-php/php-symfony:lint',
        options: defaultLintOptions,
      },
      test: {
        executor: '@nxt-php/php-symfony:test',
      },
    },
    tags: normalizedOptions.parsedTags,
  });

  console.info('Setup PHP Symfony application.');

  await promisify(exec)(`composer create-project symfony/skeleton ${normalizedOptions.projectRoot}`, {});
  await promisify(exec)(`composer require webapp`, { cwd: normalizedOptions.projectRoot });
  await promisify(exec)(`composer require --dev symfony/test-pack`, { cwd: normalizedOptions.projectRoot });
  await promisify(exec)(
    `composer require --dev php-parallel-lint/php-parallel-lint php-parallel-lint/php-console-highlighter`,
    { cwd: normalizedOptions.projectRoot },
  );

  await formatFiles(tree);
}
