import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';
import { Tree, readProjectConfiguration } from '@nrwl/devkit';

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
    appTree = createTreeWithEmptyWorkspace();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run successfully', async () => {
    await generator(appTree, options);

    expect(cp.exec).toHaveBeenCalledTimes(2);
    expect(cp.exec).toHaveBeenCalledWith(
      `composer create-project symfony/skeleton apps/test`,
      {},
      expect.any(Function)
    );
    expect(cp.exec).toHaveBeenCalledWith(`composer require phpunit webapp`, { cwd: 'apps/test' }, expect.any(Function));

    const config = readProjectConfiguration(appTree, 'test');
    expect(config).toBeDefined();
  });
});
