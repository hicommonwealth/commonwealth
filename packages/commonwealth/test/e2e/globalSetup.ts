import { FullConfig } from '@playwright/test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { sequelizeMigrationUp } from '../util/sequlizeMigration';
import { createInitialUser } from './utils/e2eUtils';

export let pgContainer;

async function globalSetup(config: FullConfig) {
  try {
    pgContainer = await new PostgreSqlContainer().start();

    // set the connectionURI for tests (cannot export because workers run in different processes)
    process.env.TEST_DB_CONNECTION_URI = pgContainer.getConnectionUri();

    const sequelize = new Sequelize(process.env.TEST_DB_CONNECTION_URI, {
      logging: false,
    });

    await sequelizeMigrationUp(sequelize);

    await createInitialUser(sequelize);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

export default globalSetup;
