import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { PhpSymfonyGeneratorSchema } from './schema';

// mock exec of child_process
jest.mock('child_process', () => ({
  exec: jest.fn((command, options, callback) => {
    callback(null, { stdout: '' });
  }),
}));
import * as cp from 'child_process';

describe('php-symfony generator', () => {
  let appTree: Tree;
  const options: PhpSymfonyGeneratorSchema = { name: 'test' };

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);

    expect(cp.exec).toHaveBeenCalledTimes(3);
    expect(cp.exec).toHaveBeenCalledWith(
      `composer create-project symfony/skeleton libs/test`,
      {},
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `composer require --dev symfony/test-pack`,
      { cwd: 'libs/test' },
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(
      `composer require --dev php-parallel-lint/php-parallel-lint php-parallel-lint/php-console-highlighter`,
      { cwd: 'libs/test' },
      expect.any(Function)
    );

    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
