'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // https://stackoverflow.com/questions/66475018/install-pg-partman-on-macos
      await queryInterface.sequelize.query(
        `
        CREATE EXTENSION pg_partman;
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TABLE "Outbox" (
          id BIGINT GENERATED ALWAYS AS IDENTITY,
          event_name TEXT NOT NULL,
          event_payload JSONB NOT NULL,
          relayed BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        ) PARTITION BY LIST(relayed);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TABLE outbox_unrelayed PARTITION OF "Outbox"
          FOR VALUES IN (false);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        CREATE TABLE outbox_relayed PARTITION OF "Outbox"
            FOR VALUES IN (true) PARTITION BY RANGE(updated_at);
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        SELECT create_parent(
          p_parent_table := 'public.outbox_relayed', -- parent natively paritioned table
          p_control := 'updated_at', -- TIMESTAMP column to partition over
          p_type := 'native', -- use PostgreSQL native partitioning func
          p_interval := 'monthly', -- each table contains 1 month worth of events
          p_premake := 2, -- create tables 2 months in advance
          p_jobmon := false -- Heroku Postgres doesn't have jobmon installed
        );
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE part_config
        SET retention = '6 months',
          retention_keep_table = false,
          retention_keep_index = false
        WHERE parent_table = 'public.outbox_relayed';
      `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        SELECT run_maintenance();
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('Outbox', { transaction });
      await queryInterface.sequelize.query(
        `
        DROP EXTENSION pg_partman;
      `,
        { transaction },
      );
    });
  },
};
