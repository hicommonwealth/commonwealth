import { dispose } from '@hicommonwealth/core';
import { Sequelize } from 'sequelize';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { models } from '../../src/database';
import { Factories } from '../../src/models/factories';
import {
  create_db_from_migrations,
  get_info_schema,
  type TABLE_INFO,
} from '../../src/tester';

const generateSchemas = async () => {
  const migration = await create_db_from_migrations('common_migrated_test');

  // TODO: resolve remaining conflicts!!!
  const model_schema = await get_info_schema(models.sequelize, {
    ignore_columns: {
      GroupGatedActions: ['gated_actions'],
      Votes: ['user_id'],
    },
    ignore_constraints: {
      // Removed in migration
      Outbox: ['PRIMARY KEY(event_id)'],
      XpLogs: [
        // Can't define index in model since it uses NULLS NOT DISTINCT
        // See 20250409215621-add-unique-name-xp-log.js for more info
        'UNIQUE(action_meta_id,event_created_at,name,user_id)',
      ],
    },
  });

  const migration_schema = await get_info_schema(migration, {
    ignore_columns: {
      // Missing in model - migrations with backups
      Comments: ['root_id'],
      Topics: ['default_offchain_template_backup'],
      GroupGatedActions: ['gated_actions'],
      Votes: ['user_id'],
    },
    ignore_constraints: {
      XpLogs: [
        // Can't define index in model since it uses NULLS NOT DISTINCT
        // See 20250409215621-add-unique-name-xp-log.js for more info
        'UNIQUE(action_meta_id,event_created_at,name,user_id)',
        // Missing in migration for performace reasons, but once this is settled we can remove it
        'FOREIGN KEY Users(referrer_user_id) UPDATE NO ACTION DELETE NO ACTION"',
      ],
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
  }, 20000);

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
