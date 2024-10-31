import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import { Sequelize } from 'sequelize';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { Factories } from '../../src/models/factories';
import {
  bootstrap_testing,
  create_db_from_migrations,
  get_info_schema,
  type TABLE_INFO,
} from '../../src/tester';

const generateSchemas = async () => {
  const model = await bootstrap_testing();
  const migration = await create_db_from_migrations('common_migrated_test');

  // TODO: resolve remaining conflicts!!!
  const model_schema = await get_info_schema(model.sequelize, {
    ignore_columns: {
      GroupPermissions: ['allowed_actions'],
    },
    ignore_constraints: {
      // Removed in migration
      Outbox: ['PRIMARY KEY(event_id)'],
    },
  });

  const migration_schema = await get_info_schema(migration, {
    ignore_columns: {
      // Missing in model - migrations with backups
      Comments: ['body_backup', 'text_backup', 'root_id'],
      Threads: ['body_backup'],
      Topics: ['default_offchain_template_backup'],
      GroupPermissions: ['allowed_actions'],
    },
    ignore_constraints: {
      Quests: ['UNIQUE(community_id,name)'], // This is found as index in model
    },
  });

  return Object.keys(model_schema)
    .filter((table) => migration_schema[table])
    .map((table) => ({
      model: model_schema[table],
      migration: migration_schema[table],
    }))
    .reduce(
      (p, c) => ({ ...p, [c.model.table_name]: c }),
      {} as Record<string, { model: TABLE_INFO; migration: TABLE_INFO }>,
    );
};

describe('Model schema', () => {
  let schemas: Record<string, { model: TABLE_INFO; migration: TABLE_INFO }>;

  beforeAll(async () => {
    schemas = await generateSchemas();
  });

  afterAll(async () => {
    await dispose()();
  });

  const s = new Sequelize({
    dialect: 'postgres',
    username: 'commonwealth',
    password: 'edgeware',
    logging: false,
  });
  Object.values(Factories).forEach((factory) => {
    const m = factory(s);
    test(`Should match ${m.tableName}`, async () => {
      const { model, migration } = schemas[m.tableName];

      //console.log(model.columns, migration.columns);
      expect(model.columns).deep.equals(migration.columns);

      // ['Quests', 'Addresses'].includes(model.table_name) &&
      //   console.log(
      //     { model, migration },
      //     //[...model.constraints.values()],
      //     //[...migration.constraints.values()],
      //   );
      expect([...model.constraints.values()]).deep.equals([
        ...migration.constraints.values(),
      ]);
    });
  });
});
