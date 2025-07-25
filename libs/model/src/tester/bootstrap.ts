import { delay } from '@hicommonwealth/shared';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path, { join } from 'path';
import { QueryTypes, Sequelize } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { config } from '../config';
import { buildDb, syncDb, type DB } from '../models';

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
      `SELECT COUNT(*)
       FROM pg_database
       WHERE datname = '${name}'`,
      { type: QueryTypes.SELECT },
    );
    if (!+count) {
      await pg.query(`CREATE DATABASE ${name};`);
      console.log('Created new test db:', name);
    }
  } catch (error) {
    console.error(`<<<Error verifying ${name}>>>`, error);
    // ignore verification errors
    // throw error;
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    pg && pg.close();
  }
};

/**
 * Executes migrations on existing sequelize instance
 * @param sequelize sequelize instance
 */
const migrate_db = async (sequelize: Sequelize) => {
  // initialize minimal schema - baseline before migrations
  const name = sequelize.getDatabaseName();
  const schemaPath = join(__dirname, '../../assets/minimal_schema.sql');
  if (existsSync(schemaPath)) {
    execSync(
      `psql -h localhost -U commonwealth -d ${name} -f "${schemaPath}"`,
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          PGPASSWORD: 'edgeware',
        },
      },
    );
    console.log(`Loaded minimal schema into ${name}`);
  } else {
    console.warn('Minimal schema file not found:', schemaPath);
  }

  const umzug = new Umzug({
    // TODO: move sequelize config and migrations to libs/model
    migrations: {
      glob: path.resolve('./migrations/*.js'),
      // migration resolver since we use v2 migration interface
      resolve: ({ name, path, context }) => {
        return {
          name,
          up: async () => {
            const migration = (await import(path!)).default;
            return migration.up(context, Sequelize);
          },
          down: async () => {
            const migration = (await import(path!)).default;
            return migration.down(context, Sequelize);
          },
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
 * Truncates all sequelize tables.
 * Use with caution since this can cause deadlocks.
 * @param db database models
 */
const truncate_db = async (db?: DB) => {
  if (!db) return;
  for (let i = 1; i <= 10; i++) {
    try {
      const tables = Object.values(db.sequelize.models)
        .map((model) => `"${model.tableName}"`)
        .join(',');
      await db.sequelize.query(
        `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`,
      );
      break;
    } catch (e) {
      console.error(`<<<Error truncating tables (${i})>>>`, e);
      await delay(100);
    }
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
};
export type TABLE_INFO = {
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
    ignore_columns: Record<string, string[]>;
    ignore_constraints: Record<string, string[]>;
  },
): Promise<Record<string, TABLE_INFO>> => {
  const columns = await db.query<COLUMN_INFO>(
    `
        SELECT table_name,
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
        SELECT C.TABLE_NAME,
               C.CONSTRAINT_TYPE || coalesce(' ' || C2.TABLE_NAME, '') || '(' || STRING_AGG(
                       K.COLUMN_NAME,
                       ','
                       ORDER BY
                           COLUMN_NAME
                                                                                 ) || ')' ||
               COALESCE(' UPDATE ' || R.UPDATE_RULE, '') || COALESCE(' DELETE ' || R.DELETE_RULE, '') AS CONSTRAINT
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS C
                 JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE K ON C.CONSTRAINT_NAME = K.CONSTRAINT_NAME
                 LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS R ON C.CONSTRAINT_NAME = R.CONSTRAINT_NAME
                 LEFT JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS C2 ON R.UNIQUE_CONSTRAINT_NAME = C2.CONSTRAINT_NAME
        WHERE C.TABLE_SCHEMA = 'public'
        GROUP BY C.TABLE_NAME,
                 C.CONSTRAINT_NAME,
                 C.CONSTRAINT_TYPE,
                 C2.TABLE_NAME,
                 R.UPDATE_RULE,
                 R.DELETE_RULE
        ORDER BY 1,
                 2;
    `,
    { type: QueryTypes.SELECT },
  );
  const tables: Record<string, TABLE_INFO> = {};
  columns
    .filter(
      (c) => !options?.ignore_columns[c.table_name]?.includes(c.column_name),
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
      (c) => !options?.ignore_constraints[c.table_name]?.includes(c.constraint),
    )
    .forEach((c) => tables[c.table_name].constraints.add(c.constraint));
  return tables;
};

let db: DB | undefined = undefined;

/**
 * Bootstraps testing
 * Creates a clean model if it doesn't exist
 * @returns synchronized and truncated sequelize db instance
 */
export async function bootstrap_testing(): Promise<DB> {
  if (!db) {
    const db_name = config.DB.NAME;
    try {
      await verify_db(db_name);
      db = buildDb(
        new Sequelize({
          dialect: 'postgres',
          database: db_name,
          username: 'commonwealth',
          password: 'edgeware',
          logging: false,
        }),
      );
      await syncDb(db);
      await truncate_db(db);
      console.log(`Bootstrapped [${db_name}]`);
    } catch (e) {
      console.error(`<<<Error bootstrapping ${db_name}>>>`, e);
      throw e;
    }
  }
  return db;
}
