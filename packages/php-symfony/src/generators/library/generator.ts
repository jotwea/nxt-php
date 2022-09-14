import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import * as path from 'path';
import { PhpSymfonyGeneratorSchema } from './schema';
import { promisify } from 'util';
import { exec } from 'child_process';

interface NormalizedSchema extends PhpSymfonyGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(tree: Tree, options: PhpSymfonyGeneratorSchema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
  };
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}

export default async function (tree: Tree, options: PhpSymfonyGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  addProjectConfiguration(tree, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'library',
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
      lint: {
        executor: '@nxt-php/php-symfony:lint',
      },
      test: {
        executor: '@nxt-php/php-symfony:test',
      },
    },
    tags: normalizedOptions.parsedTags,
  });

  console.info('Setup PHP Symfony library.');

  await promisify(exec)(`composer create-project symfony/skeleton ${normalizedOptions.projectRoot}`, {});
  await promisify(exec)(`composer require --dev symfony/test-pack`, { cwd: normalizedOptions.projectRoot });
  await promisify(exec)(
    `composer require --dev php-parallel-lint/php-parallel-lint php-parallel-lint/php-console-highlighter`,
    { cwd: normalizedOptions.projectRoot }
  );

  addFiles(tree, normalizedOptions);
  await formatFiles(tree);
}
