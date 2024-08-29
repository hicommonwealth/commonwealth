console.log('LOADING src/tester/vitestDatabaseSetup.ts START');
import { config } from '../config';

/**
 * A global database setup function for Vitest. This function is executed once before all Vitest test suites.
 */
export async function setup(): Promise<void> {
  if (config.NODE_ENV !== 'test')
    throw new Error('Seeds only work when testing!');

  if (!config.DB.INIT_TEST_DB) {
    console.warn('Database not initialized');
    return;
  }

  const { Sequelize } = await import('sequelize');
  const { buildDb, syncDb } = await import('../models');
  const { verify_db } = await import('./bootstrap');

  await verify_db(config.DB.NAME);
  try {
    const db = buildDb(
      new Sequelize({
        dialect: 'postgres',
        database: config.DB.NAME,
        username: 'commonwealth',
        password: 'edgeware',
        logging: false,
      }),
    );
    await syncDb(db);
    console.log('Database synced!');
  } catch (error) {
    console.error('Error bootstrapping test db:', error);
    throw error;
  }
}

export default setup;

console.log('LOADING src/tester/vitestDatabaseSetup.ts END');
