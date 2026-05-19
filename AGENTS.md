# Agent Guidelines

## Git Workflow

- Never push directly to `master`. Always create a branch and open a PR.
- Branch naming: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
  - Only `feat:` and `fix:` appear in the changelog / release notes.

## Running Tasks

Always run tasks through Nx, never the underlying tooling directly:

```bash
# Affected only (recommended during development)
npx nx affected -t lint test build

# Specific project
npx nx run php-symfony:test
npx nx run php-symfony:build
npx nx run php-symfony:lint

# All e2e tests
npx nx run php-symfony-e2e:e2e
```

## Before Every Commit

```bash
npx nx format:check
```

Fix formatting issues with `npx prettier --write <file>` before committing.

## Before Opening a PR

```bash
npx nx format:check
npx nx affected -t lint test build
```

Fix all lint and test failures before pushing. Do not open a PR with a failing CI.

## Adding a New Executor or Generator

- Executors live in `packages/php-symfony/src/executors/<name>/`
- Generators live in `packages/php-symfony/src/generators/<name>/`
- Each must have: `executor.ts` / `generator.ts`, `schema.json`, `schema.d.ts`, and a `.spec.ts` test file.
- Register new executors in `packages/php-symfony/executors.json` and generators in `packages/php-symfony/generators.json`.

## Release Process

Releases are triggered manually via the **Release** GitHub Actions workflow (`workflow_dispatch` on `master`).  
The workflow runs `nx release`, which:

1. Bumps versions based on Conventional Commits
2. Generates / updates `CHANGELOG.md`
3. Creates a Git tag and GitHub Release
4. Publishes `@nxt-php/php-symfony` to npm

**Required GitHub secret:** `NPM_TOKEN` (npm granular access token with read+write for `@nxt-php/php-symfony`).

## Project Structure

```
packages/
  php-symfony/        # @nxt-php/php-symfony – the Nx plugin
    src/
      executors/      # Nx executors (build, test, lint, e2e)
      generators/     # Nx generators (application, library)
e2e/
  php-symfony-e2e/    # End-to-end tests for the plugin
```
