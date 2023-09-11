import { FullConfig } from '@playwright/test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { Sequelize } from 'sequelize';
import { createInitialUser } from './utils/e2eUtils';

export let pgContainer;

// This connection is used to speed up tests, so we don't need to load in all the models with the associated
// imports. This can only be used with raw sql queries.
export let dbClient;

export const testAddress = '0x0bad5AA8Adf8bA82198D133F9Bb5a48A638FCe88';

async function globalSetup(config: FullConfig) {
  pgContainer = await new PostgreSqlContainer().start();

  dbClient = new Sequelize({
    dialect: 'postgres',
    host: pgContainer.getHost(),
    port: pgContainer.getPort(),
    database: pgContainer.getDatabase(),
    username: pgContainer.getUsername(),
    password: pgContainer.getPassword(),
    logging: false,
  });

  await dbClient.connect();

  await createInitialUser();
}

export default globalSetup;
