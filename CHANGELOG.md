# 9.0.0 (2026-05-19)

### 🚀 Features

- add CI pipeline and release workflow ([#8](https://github.com/jotwea/nxt-php/pull/8))
- ⚠️ delegate lint executor to composer scripts ([#10](https://github.com/jotwea/nxt-php/pull/10))

### 🩹 Fixes

- set publish packageRoot to dist/{projectRoot} ([#11](https://github.com/jotwea/nxt-php/pull/11))
- set releaseTagPattern to match existing tags without v-prefix ([2fb9b86](https://github.com/jotwea/nxt-php/commit/2fb9b86))

### ⚠️ Breaking Changes

- delegate lint executor to composer scripts ([#10](https://github.com/jotwea/nxt-php/pull/10))
  removes fix, ignoreEnv, and format options from the lint executor schema. Projects must define composer scripts (lint, lint-static) in composer.json instead.
  Replaces direct tool detection (parallel-lint, php-cs-fixer, phpstan, bin/console lint:\*) with a composer script dispatcher. Tool selection and configuration moves entirely into composer.json.
  Without outputFile: runs `composer run lint`.
  With outputFile: runs `lint-static` first (aborts on failure), then each reportScripts entry writes to a derived output path.

### ❤️ Thank You

- jotwea
- Ona

# Changelog

This file was generated manually to document releases prior to automated changelog generation (introduced in 9.0.0). From 9.0.0 onwards this file is maintained by `nx release`.

## 8.0.0 (2026-04-23)

- Remove safety fallback (`|| true`) for linter commands

## 7.0.0 (2026-01-21)

- Update Nx, prevent out-of-memory errors during builds

## 6.0.1 (2025-03-31)

- Refine lint options

## 6.0.0 (2025-03-28)

- Add PHP-CS-Fixer and PHPStan as supported linter tools

## 5.2.0 (2024-12-30)

- Migrate to ESLint flat config
- Add `COMPOSER_HOME` and `APPDATA` env vars for cross-platform support

## 5.1.0 (2024-11-29)

- Support paratest for parallel test execution

## 5.0.0 (2024-10-22)

- Migrate to Nx 20

## 4.0.0 (2024-05-21)

- Migrate to Nx 19
- Silent composer installs

## 3.0.0 (2023-11-10)

- Migrate to Nx 17

## 2.2.2 (2023-02-03)

- Fix cobertura report filename

## 2.2.0 (2023-02-03)

- Support cobertura coverage format

## 2.1.1 (2023-01-09)

- Avoid symlinks for composer install

## 2.1.0 (2022-12-02)

- Redesign to avoid redundant `composer install` calls

## 2.0.0 (2022-10-19)

- Migrate to Nx 15

## 1.2.0 (2022-09-29)

- Add e2e testing support

## 1.1.0 (2022-09-14)

- Support plain PHP libraries without Symfony dependencies

## 1.0.2 (2022-07-08)

- Fix: add lint target to generated `project.json`

## 1.0.1 (2022-06-27)

- Fix: copy assets in production configuration, relative symlinks for development only

## 1.0.0 (2022-06-18)

- Initial stable release
- Lint, test, build, e2e executors
- Application and library generators
