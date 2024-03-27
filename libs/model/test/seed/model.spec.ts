import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import {
  bootstrap_testing,
  create_db_from_migrations,
  get_info_schema,
} from '../../src/tester';

const generateSchemas = async () => {
  const model = await bootstrap_testing();
  const migration = await create_db_from_migrations('common_migrated_test');

  // TODO: resolve remaining conflicts
  const model_schema = await get_info_schema(model.sequelize, {
    ignore_tables: ['Outbox'],
    ignore_columns: {},
    ignore_constraints: {
      // TODO: missing in migrations (removed FKs for performance reasons?)
      Addresses: ['FOREIGN KEY(profile_id)'],
      Collaborations: ['PRIMARY KEY(address_id,thread_id)'],
      Comments: ['FOREIGN KEY(community_id)'],
      CommunityContracts: ['UNIQUE(community_id)'],
      CommunitySnapshotSpaces: [
        'FOREIGN KEY(community_id)',
        'FOREIGN KEY(snapshot_space_id)',
      ],
      Memberships: ['PRIMARY KEY(address_id,group_id)'],
      Notifications: ['FOREIGN KEY(thread_id)'],
      Profiles: ['FOREIGN KEY(user_id)'],
      Reactions: ['FOREIGN KEY(address_id)', 'FOREIGN KEY(community_id)'],
      SnapshotProposals: ['FOREIGN KEY(space)'],
      SsoTokens: ['FOREIGN KEY(address_id)'],
      StarredCommunities: ['FOREIGN KEY(community_id)', 'FOREIGN KEY(user_id)'],
      Subscriptions: [
        'FOREIGN KEY(comment_id)',
        'FOREIGN KEY(community_id)',
        'FOREIGN KEY(thread_id)',
      ],
      Template: ['FOREIGN KEY(abi_id)'],
      Threads: ['FOREIGN KEY(topic_id)'],
      Topics: ['FOREIGN KEY(community_id)'],
    },
  });
  const migration_schema = await get_info_schema(migration, {
    ignore_tables: ['Outbox'],
    ignore_columns: {
      // TODO: missing in model
      Comments: ['body_backup', 'text_backup', 'root_id', '_search'],
      Profiles: ['bio_backup', 'profile_name_backup'],
      Threads: ['body_backup', '_search'],
      Topics: ['default_offchain_template_backup'],
    },
    ignore_constraints: {
      // TODO: missing in model
      Collaborations: ['FOREIGN KEY(address_id)', 'FOREIGN KEY(thread_id)'],
      CommunityStakes: ['FOREIGN KEY(community_id)'],
      LastProcessedEvmBlocks: ['FOREIGN KEY(chain_node_id)'],
      Memberships: ['FOREIGN KEY(address_id)', 'FOREIGN KEY(group_id)'],
      StakeTransactions: ['FOREIGN KEY(community_id,stake_id)'],
    },
  });

  return Object.keys(model_schema)
    .filter((table) => migration_schema[table])
    .map((table) => ({
      model: model_schema[table],
      migration: migration_schema[table],
    }))
    .sort((a, b) => a.model.table_name.localeCompare(b.model.table_name));
};

generateSchemas().then((schemas) => {
  describe('Model schema', () => {
    after(async () => {
      await dispose()();
    });

    schemas.forEach(({ model, migration }) => {
      it(`Should match schema of "${model.table_name}"`, () => {
        //console.log(model.table_name, model.columns, migration.columns);
        expect(model.columns).deep.equals(migration.columns);

        //TODO: reconcile constraints - too many naming issues found
        //console.log(model.table_name, model.constraints, migration.constraints);
        expect([...model.constraints.values()]).deep.equals([
          ...migration.constraints.values(),
        ]);
      });
    });
  });

  // mocha with --delay option is required to "run" dynamic async tests
  run();
});
