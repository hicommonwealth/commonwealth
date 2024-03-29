import { dispose } from '@hicommonwealth/core';
import path from 'node:path';
import { QueryTypes, Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { TESTING, TEST_DB_NAME } from '../config';
import { buildDb, type DB } from '../models';

/**
 * Verifies the existence of a database,
 * creating a fresh instance if it doesn't exist.
 * @param name db name
 */
const verify_db = async (name: string): Promise<void> => {
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
      `SELECT COUNT(*) FROM pg_database WHERE datname = '${name}'`,
      { type: QueryTypes.SELECT },
    );
    if (!+count) {
      await pg.query(`CREATE DATABASE ${name};`);
      console.log('Created new test db:', name);
    }
  } catch (error) {
    console.error(`Error verifying db [${name}]:`, error);
    throw error;
  } finally {
    pg && pg.close();
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
      glob: path.resolve('../../packages/commonwealth/server/migrations/*.js'),
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
    logger: undefined,
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
 * Creates a new db from migrations
 * @param name db name
 * @returns migrated sequelize db instance
 */
export const create_db_from_migrations = async (
  name: string,
): Promise<Sequelize> => {
  await verify_db(name);
  try {
    const sequelize = new Sequelize({
      dialect: 'postgres',
      database: name,
      username: 'commonwealth',
      password: 'edgeware',
      logging: false,
    });
    await migrate_db(sequelize);
    return sequelize;
  } catch (error) {
    console.error('Error creating db from migrations:', error);
    throw error;
  }
};

type COLUMN_INFO = {
  table_name: string;
  column_name: string;
  column_type: string;
  column_default?: string;
};
type CONSTRAINT_INFO = {
  table_name: string;
  constraint: string;
  constraint_name: string;
};
type TABLE_INFO = {
  table_name: string;
  columns: Record<string, string>;
  constraints: Set<string>;
};

/**
 * Queries sequelize information schema
 * @param db sequelize instance
 * @param options elements of the schema we are not reconciling (backup columns used in data migrations, etc.)
 */
export const get_info_schema = async (
  db: Sequelize,
  options?: {
    ignore_tables: string[];
    ignore_columns: Record<string, string[]>;
    ignore_constraints: Record<string, string[]>;
  },
): Promise<Record<string, TABLE_INFO>> => {
  const columns = await db.query<COLUMN_INFO>(
    `
SELECT 
	table_name,
	column_name, 
	COALESCE(udt_name || '(' || character_maximum_length || ')', udt_name) 
	|| CASE WHEN is_identity = 'YES' THEN '-id' ELSE '' END
	|| CASE WHEN is_nullable = 'YES' THEN '-null' ELSE '' END as column_type,
	column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY 1, 2;`,
    { type: QueryTypes.SELECT },
  );
  const constraints = await db.query<CONSTRAINT_INFO>(
    `
SELECT 
	c.table_name, 
	c.constraint_type || '(' || STRING_AGG(k.column_name, ',' order by column_name) || ')' as constraint,
	c.constraint_name
FROM 
	information_schema.table_constraints c
	JOIN information_schema.key_column_usage k on c.constraint_name = k.constraint_name
WHERE c.table_schema = 'public'
GROUP BY c.table_name, c.constraint_name, c.constraint_type
ORDER BY 1, 2;`,
    { type: QueryTypes.SELECT },
  );
  const tables: Record<string, TABLE_INFO> = {};
  columns
    .filter(
      (c) =>
        !options?.ignore_tables.includes(c.table_name) &&
        !options?.ignore_columns[c.table_name]?.includes(c.column_name),
    )
    .forEach((c) => {
      const t = (tables[c.table_name] = tables[c.table_name] ?? {
        table_name: c.table_name,
        columns: {},
        constraints: new Set(),
      });
      t.columns[c.column_name] = c.column_type;
    });
  constraints
    .filter(
      (c) =>
        !options?.ignore_tables.includes(c.table_name) &&
        !options?.ignore_constraints[c.table_name]?.includes(c.constraint),
    )
    .forEach((c) => tables[c.table_name].constraints.add(c.constraint));
  return tables;
};

let testdb: DB | undefined = undefined;
/**
 * Bootstraps testing, by verifying the existence of TEST_DB_NAME on the server,
 * and creating/migrating a fresh instance if it doesn't exist.
 * @param truncate when true, truncates all tables in model
 * @returns synchronized sequelize db instance
 */
export const bootstrap_testing = async (
  truncate = false,
  log = false,
): Promise<DB> => {
  if (!TESTING) throw new Error('Seeds only work when testing!');
  if (!testdb) {
    await verify_db(TEST_DB_NAME);
    try {
      testdb = buildDb(
        new Sequelize({
          dialect: 'postgres',
          database: TEST_DB_NAME,
          username: 'commonwealth',
          password: 'edgeware',
          logging: false,
        }),
      );
      await testdb.sequelize.sync({
        force: true,
        logging: log ? console.log : false,
      });
    } catch (error) {
      console.error('Error bootstrapping test db:', error);
      throw error;
    }
  } else if (truncate) await truncate_db(testdb);
  return testdb;
};

TESTING && dispose(async () => truncate_db(testdb));
