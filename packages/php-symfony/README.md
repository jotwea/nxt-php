# @nxt-php/php-symfony

[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

An [Nx plugin](https://nx.dev) for developing applications and libraries using [PHP Symfony](https://symfony.com/).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

In order to use this plugin within your NX workspace, you need to do some manual steps which cannot be done by the plugin:

- Install PHP 8.0.2 or higher and your required [PHP extensions](https://symfony.com/doc/current/setup.html#technical-requirements)
- [Install Composer](https://getcomposer.org/download/), which is used to install PHP packages.
- Install the PCOV extension used for code coverage during test execution

## Usage

### Install plugin

`npm install --save-dev @nxt-php/php-symfony`

### Generate an application

Run `nx g @nxt-php/php-symfony:app my-app` to generate a symfony application.

### Generate a library

Run `nx g @nxt-php/php-symfony:lib my-lib` to generate a symfony library.

### Build

Run `nx build my-app` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

### Running unit tests

Run `nx test my-app` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx affected:test` to execute the unit tests affected by a change.

## Maintainers

[@jotwea](https://github.com/jotwea)

## Contributing

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © 2022 Josef Wagner
