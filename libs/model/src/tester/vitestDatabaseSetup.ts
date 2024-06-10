import { Sequelize } from 'sequelize';
import { config } from '../config';
import { buildDb, syncDb } from '../models';
import { verify_db } from './bootstrap';

/**
 * A global database setup function for Vitest. This function is executed once before all Vitest test suites.
 */
export default async function setup(): Promise<void> {
  if (config.NODE_ENV !== 'test')
    throw new Error('Seeds only work when testing!');

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
