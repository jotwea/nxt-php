import { names, readNxJson, Tree } from '@nx/devkit';
import { PhpSymfonyGeneratorSchema } from '../application/schema';

export interface NormalizedSchema extends PhpSymfonyGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

const LAYOUT_KEY: Record<'application' | 'library', 'appsDir' | 'libsDir'> = {
  application: 'appsDir',
  library: 'libsDir',
};

const LAYOUT_DEFAULT: Record<'application' | 'library', string> = {
  application: 'apps',
  library: 'libs',
};

function getProjectBaseDir(tree: Tree, projectType: 'application' | 'library'): string {
  const nxJson = readNxJson(tree);
  return nxJson?.workspaceLayout?.[LAYOUT_KEY[projectType]] ?? LAYOUT_DEFAULT[projectType];
}

export function normalizeOptions(
  tree: Tree,
  options: PhpSymfonyGeneratorSchema,
  projectType: 'application' | 'library',
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getProjectBaseDir(tree, projectType)}/${projectDirectory}`;
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
