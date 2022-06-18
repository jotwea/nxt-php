import { checkFilesExist, ensureNxProject, readJson, runNxCommandAsync, uniq } from '@nrwl/nx-plugin/testing';

describe('php-symfony e2e', () => {
  const timeout = 180000;

  it(
    'should create php-symfony application',
    async () => {
      const projectName = uniq('php-symfony');
      ensureNxProject('@nxt-php/php-symfony', 'dist/packages/php-symfony');
      await runNxCommandAsync(`generate @nxt-php/php-symfony:application ${projectName}`);

      const result = await runNxCommandAsync(`build ${projectName}`);
      expect(() =>
        checkFilesExist(
          `apps/${projectName}/composer.json`,
          `apps/${projectName}/composer.lock`,
          `apps/${projectName}/symfony.lock`,
          `apps/${projectName}/vendor`,
          `apps/${projectName}/bin/phpunit`
        )
      ).not.toThrow();
    },
    timeout
  );

  it(
    'should create php-symfony library',
    async () => {
      const projectName = uniq('php-symfony');
      ensureNxProject('@nxt-php/php-symfony', 'dist/packages/php-symfony');
      await runNxCommandAsync(`generate @nxt-php/php-symfony:library ${projectName}`);

      const result = await runNxCommandAsync(`build ${projectName}`);
      expect(() =>
        checkFilesExist(
          `libs/${projectName}/composer.json`,
          `libs/${projectName}/composer.lock`,
          `libs/${projectName}/symfony.lock`,
          `libs/${projectName}/vendor`,
          `libs/${projectName}/bin/phpunit`
        )
      ).not.toThrow();
    },
    timeout
  );

  describe('--directory', () => {
    it(
      'should create src in the specified directory',
      async () => {
        const projectName = uniq('php-symfony');
        ensureNxProject('@nxt-php/php-symfony', 'dist/packages/php-symfony');
        await runNxCommandAsync(`generate @nxt-php/php-symfony:library ${projectName} --directory subdir`);
        expect(() => checkFilesExist(`libs/subdir/${projectName}/src/index.ts`)).not.toThrow();
      },
      timeout
    );
  });

  describe('--tags', () => {
    it(
      'should add tags to the project',
      async () => {
        const projectName = uniq('php-symfony');
        ensureNxProject('@nxt-php/php-symfony', 'dist/packages/php-symfony');
        await runNxCommandAsync(`generate @nxt-php/php-symfony:library ${projectName} --tags e2etag,e2ePackage`);
        const project = readJson(`libs/${projectName}/project.json`);
        expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
      },
      timeout
    );
  });
});
