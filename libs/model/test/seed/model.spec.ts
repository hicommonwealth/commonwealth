import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import { Sequelize } from 'sequelize';
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
    ignore_columns: {},
    ignore_constraints: {
      // Removed in production for performance reasons
      Comments: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE NO ACTION',
      ],
      Reactions: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE NO ACTION',
      ],

      // These will be deprecated soon
      Notifications: [
        'FOREIGN KEY Threads(thread_id) UPDATE NO ACTION DELETE NO ACTION',
      ],
      Subscriptions: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE SET NULL',
        'FOREIGN KEY Threads(thread_id) UPDATE CASCADE DELETE SET NULL',
        'FOREIGN KEY Comments(comment_id) UPDATE CASCADE DELETE SET NULL',
      ],
      NotificationsRead: [
        'FOREIGN KEY Notifications(notification_id) UPDATE NO ACTION DELETE CASCADE',
        'FOREIGN KEY Subscriptions(subscription_id) UPDATE NO ACTION DELETE CASCADE',
      ],
      Addresses: [
        'FOREIGN KEY Profiles(profile_id) UPDATE NO ACTION DELETE NO ACTION',
      ],

      // Removed in migration
      Outbox: ['PRIMARY KEY(event_id)'],
    },
  });
  const migration_schema = await get_info_schema(migration, {
    ignore_columns: {
      // Missing in model - migrations with backups
      Comments: ['body_backup', 'text_backup', 'root_id', '_search'],
      Profiles: ['bio_backup', 'profile_name_backup'],
      Threads: ['body_backup', '_search'],
      Topics: ['default_offchain_template_backup'],
    },
    ignore_constraints: {},
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

  before(async () => {
    schemas = await generateSchemas();
  });

  after(async () => {
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
    it(`Should match ${m.tableName}`, async () => {
      const { model, migration } = schemas[m.tableName];

      //console.log(model.columns, migration.columns);
      expect(model.columns).deep.equals(migration.columns);

      // model.table_name === 'Topics' &&
      //   console.log(
      //     [...model.constraints.values()],
      //     [...migration.constraints.values()],
      //   );
      expect([...model.constraints.values()]).deep.equals([
        ...migration.constraints.values(),
      ]);
    });
  });
});
