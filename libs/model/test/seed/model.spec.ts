import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import { DataTypes, Sequelize } from 'sequelize';
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
      // TODO: missing in migrations - removed FKs for performance reasons?
      Addresses: [
        'FOREIGN KEY Profiles(profile_id) UPDATE CASCADE DELETE SET NULL',
      ],
      Comments: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE NO ACTION',
      ],
      CommunityContracts: ['UNIQUE(community_id)'],
      CommunitySnapshotSpaces: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE NO ACTION',
        'FOREIGN KEY SnapshotSpaces(snapshot_space_id) UPDATE CASCADE DELETE NO ACTION',
      ],
      Memberships: ['PRIMARY KEY(id)'],
      Notifications: [
        'FOREIGN KEY Threads(thread_id) UPDATE CASCADE DELETE SET NULL',
      ],
      Outbox: ['PRIMARY KEY(event_id)'],
      Profiles: ['FOREIGN KEY Users(user_id) UPDATE CASCADE DELETE NO ACTION'],
      Reactions: [
        'FOREIGN KEY Addresses(address_id) UPDATE CASCADE DELETE NO ACTION',
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE NO ACTION',
      ],
      SnapshotProposals: [
        'FOREIGN KEY SnapshotSpaces(space) UPDATE CASCADE DELETE NO ACTION',
      ],
      SsoTokens: [
        'FOREIGN KEY Addresses(address_id) UPDATE CASCADE DELETE SET NULL',
      ],
      StarredCommunities: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE NO ACTION',
        'FOREIGN KEY Users(user_id) UPDATE CASCADE DELETE NO ACTION',
      ],
      Subscriptions: [
        'FOREIGN KEY Comments(comment_id) UPDATE CASCADE DELETE SET NULL',
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE SET NULL',
        'FOREIGN KEY Threads(thread_id) UPDATE CASCADE DELETE SET NULL',
      ],
      Template: [
        'FOREIGN KEY ContractAbis(abi_id) UPDATE CASCADE DELETE NO ACTION',
      ],
      Threads: ['FOREIGN KEY Topics(topic_id) UPDATE CASCADE DELETE SET NULL'],
      Topics: [
        'FOREIGN KEY Communities(community_id) UPDATE CASCADE DELETE CASCADE',
      ],
    },
  });
  const migration_schema = await get_info_schema(migration, {
    ignore_columns: {
      // TODO: missing in model - due to migrations with backups?
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
    const m = factory(s, DataTypes);
    it(`Should match ${m.tableName}`, async () => {
      const { model, migration } = schemas[m.tableName];

      //console.log(model.columns, migration.columns);
      expect(model.columns).deep.equals(migration.columns);

      //TODO: reconcile constraints - too many naming issues found
      // console.log(
      //   [...model.constraints.values()],
      //   [...migration.constraints.values()],
      // );
      expect([...model.constraints.values()]).deep.equals([
        ...migration.constraints.values(),
      ]);
    });
  });
});
