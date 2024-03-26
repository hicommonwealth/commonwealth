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
  const model_schema = await get_info_schema(model.sequelize, {
    ignore_tables: ['Outbox'],
    ignore_columns: {
      Profiles: ['user_id'], // TODO: user_id is also a FK null issue
      Collaborations: ['address_id', 'thread_id'], // TODO: fix FK null issue
    },
  });
  const migration_schema = await get_info_schema(migration, {
    ignore_tables: ['Outbox'],
    ignore_columns: {
      Comments: ['body_backup', 'text_backup', 'root_id', '_search'],
      Profiles: ['bio_backup', 'profile_name_backup', 'user_id'], // TODO: user_id is also a FK null issue
      Threads: ['body_backup', '_search'],
      Topics: ['default_offchain_template_backup'],
      Collaborations: ['address_id', 'thread_id'], // TODO: fix FK null issue
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
        //expect(model.constraints).deep.equals(migration.constraints);
      });
    });
  });

  // mocha with --delay option is required to "run" dynamic async tests
  run();
});
