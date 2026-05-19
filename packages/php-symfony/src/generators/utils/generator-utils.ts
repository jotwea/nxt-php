import { getWorkspaceLayout, names, Tree } from '@nx/devkit';
import { PhpSymfonyGeneratorSchema } from '../application/schema';

export interface NormalizedSchema extends PhpSymfonyGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

export function normalizeOptions(
  tree: Tree,
  options: PhpSymfonyGeneratorSchema,
  projectDir: 'appsDir' | 'libsDir',
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree)[projectDir]}/${projectDirectory}`;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
  };
}

export const defaultLintOptions = {
  reportScripts: [
    { script: 'lint-cs-ci', suffix: 'cs-fixer' },
    { script: 'phpstan-ci', suffix: 'phpstan' },
  ],
};
