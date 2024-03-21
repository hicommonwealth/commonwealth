import { dispose } from '@hicommonwealth/core';
import path from 'node:path';
import { QueryTypes, Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { TESTING, TEST_DB_NAME } from '../config';
import { buildDb, type DB } from '../models';

/**
 * Verifies the existence of TEST_DB_NAME on the server,
 * creating a fresh instance if it doesn't exist.
 */
const verify_testdb = async (): Promise<DB> => {
  let pg: Sequelize | undefined = undefined;
  try {
    pg = new Sequelize({
      dialect: 'postgres',
      database: 'postgres',
      username: 'commonwealth',
      password: 'edgeware',
      logging: false,
    });
    const [{ count }] = await pg.query<{ count: number }>(
      `SELECT COUNT(*) FROM pg_database WHERE datname = '${TEST_DB_NAME}'`,
      { type: QueryTypes.SELECT },
    );
    if (!+count) await pg.query(`CREATE DATABASE ${TEST_DB_NAME};`);
  } catch (error) {
    console.error('Error verifying test db:', error);
    throw error;
  } finally {
    pg && pg.close();
  }
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      database: TEST_DB_NAME,
      username: 'commonwealth',
      password: 'edgeware',
      logging: false,
    });
    return buildDb(sequelize);
  } catch (error) {
    console.error('Error building test db:', error);
    throw error;
  }
};

/**
 * Executes migrations on existing sequelize instance
 * @param sequelize sequelize instance
 */
export const migrate_db = async (sequelize: Sequelize) => {
  const umzug = new Umzug({
    // TODO: move sequelize config and migrations to libs/model
    migrations: {
      glob: path.join(
        __dirname,
        '../../../packages/commonwealth/server/migrations/*.js',
      ),
      // migration resolver since we use v2 migration interface
      resolve: ({ name, path, context }) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const migration = require(path!);
        return {
          name,
          up: async () => migration.up(context, Sequelize),
          down: async () => migration.down(context, Sequelize),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
  await umzug.up();
};

/**
 * Truncates all tables
 * @param db database models
 */
export const truncate_db = async (db?: DB) => {
  if (!db) return;
  try {
    const tables = Object.values(db.sequelize.models)
      .map((model) => `"${model.tableName}"`)
      .join(',');
    await db.sequelize.query(
      `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
    );
  } catch {
    // ignore failed truncate
  }
};

/**
 * TODO: Validates if existing sequelize model is in sync with migrations
 * - Create database A from migrations
 * - Create database B from model (sync)
 * - Compare schemas A & B for differences
 */
export const verify_model_vs_migrations = async () => {
  return Promise.resolve();
};

let testdb: DB | undefined = undefined;
/**
 * Bootstraps testing, by verifying the existence of TEST_DB_NAME on the server,
 * and creating/migrating a fresh instance if it doesn't exist.
 * @param truncate when true, truncates all tables in model
 */
export const bootstrap_testing = async (truncate = false): Promise<DB> => {
  if (!TESTING) throw new Error('Seeds only work when testing!');
  if (!testdb) {
    testdb = await verify_testdb();
    // TODO: use migrate instead of sync
    //await migrate_db(testdb.sequelize);
    await testdb.sequelize.sync({ force: true });
  } else if (truncate) await truncate_db(testdb);
  return testdb;
};

TESTING && dispose(async () => truncate_db(testdb));
