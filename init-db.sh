#!/bin/bash
set -e

# Create the test database using the environment variables
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
    CREATE DATABASE shopping_cart_test;
    GRANT ALL PRIVILEGES ON DATABASE shopping_cart_test TO "$POSTGRES_USER";
EOSQL