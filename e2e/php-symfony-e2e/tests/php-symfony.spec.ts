import { checkFilesExist, ensureNxProject, readJson, runNxCommandAsync, uniq } from '@nx/plugin/testing';

describe('php-symfony e2e', () => {
  const timeout = 240000;

  beforeAll(() => {
    ensureNxProject('@nxt-php/php-symfony', 'dist/packages/php-symfony');
  });

  it(
    'should create php-symfony application',
    async () => {
      const projectName = uniq('php-symfony');
      await runNxCommandAsync(`generate @nxt-php/php-symfony:application ${projectName}`);

      await runNxCommandAsync(`build ${projectName}`);
      expect(() =>
        checkFilesExist(
          `${projectName}/composer.json`,
          `${projectName}/composer.lock`,
          `${projectName}/symfony.lock`,
          `${projectName}/vendor`,
          `${projectName}/bin/console`,
          `${projectName}/bin/phpunit`,
        ),
      ).not.toThrow();
    },
    timeout,
  );

  it(
    'should create php-symfony library',
    async () => {
      const projectName = uniq('php-symfony');
      await runNxCommandAsync(`generate @nxt-php/php-symfony:library ${projectName}`);

      await runNxCommandAsync(`build ${projectName}`);
      expect(() =>
        checkFilesExist(
          `${projectName}/composer.json`,
          `${projectName}/composer.lock`,
          `${projectName}/symfony.lock`,
          `${projectName}/vendor`,
          `${projectName}/bin/console`,
          `${projectName}/bin/phpunit`,
        ),
      ).not.toThrow();
    },
    timeout,
  );

  describe('--directory', () => {
    it(
      'should create project in the specified directory',
      async () => {
        const projectName = uniq('php-symfony');
        await runNxCommandAsync(`generate @nxt-php/php-symfony:library ${projectName} --directory subdir`);
        expect(() => checkFilesExist(`libs/subdir/${projectName}/composer.json`)).not.toThrow();
      },
      timeout,
    );
  });

  describe('--tags', () => {
    it(
      'should add tags to the project',
      async () => {
        const projectName = uniq('php-symfony');
        await runNxCommandAsync(`generate @nxt-php/php-symfony:library ${projectName} --tags e2etag,e2ePackage`);
        const project = readJson(`libs/${projectName}/project.json`);
        expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
      },
      timeout,
    );
  });
});
