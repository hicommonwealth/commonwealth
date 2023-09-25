import { FullConfig } from '@playwright/test';
import * as process from 'process';
import { Sequelize } from 'sequelize';
import { createInitialUser } from './utils/e2eUtils';

async function globalSetup(config: FullConfig) {
  try {
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      logging: false,
    });

    await createInitialUser(sequelize);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
}

export default globalSetup;
