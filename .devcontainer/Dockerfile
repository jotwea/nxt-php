FROM php:8.5-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
        libzip-dev \
        unzip \
    && docker-php-ext-install zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
