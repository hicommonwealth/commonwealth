'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // some new-thread-creation subscriptions are missing a chain_id
      // creation of such subscriptions is no longer possible with the checks added below and the Sequelize model validation
      await queryInterface.sequelize.query(
        `
        UPDATE "Subscriptions"
        SET chain_id = object_id
        WHERE category_id = 'new-thread-creation' AND chain_id IS NULL;
      `,
        { transaction: t }
      );

      await queryInterface.removeColumn('Subscriptions', 'object_id', {
        transaction: t,
      });

      // https://www.postgresql.org/docs/current/sql-altertable.html#SQL-ALTERTABLE-NOTES
      // The NOT VALID option means that PostgreSQL will not scan the entire table to ensure the constraint holds for
      // existing records. This is okay since we know that all existing records are valid. This hugely increases
      // performance since the checks can be committed directly.
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Subscriptions"
            ADD CONSTRAINT "chk_chain_id_on_chain_event"
                CHECK ((category_id <> 'chain-event') OR (category_id = 'chain-event' AND chain_id IS NOT NULL)) NOT VALID,
            ADD CONSTRAINT "chk_snapshot_id_on_snapshot_proposal"
                CHECK ((category_id <> 'snapshot-proposal') OR (category_id = 'snapshot-proposal' AND snapshot_id IS NOT NULL)) NOT VALID,
            ADD CONSTRAINT "chk_chain_id_on_new_thread"
                CHECK ((category_id <> 'new-thread-creation') OR
                       (category_id = 'new-thread-creation' AND chain_id IS NOT NULL)) NOT VALID,
            ADD CONSTRAINT "chk_thread_id_comment_id_on_new_reaction"
                CHECK ((category_id <> 'new-reaction') OR (category_id = 'new-reaction' AND
                                                           ((thread_id IS NOT NULL AND comment_id IS NULL) OR
                                                            (thread_id IS NULL AND comment_id IS NOT NULL)))) NOT VALID,
            ADD CONSTRAINT "chk_thread_id_comment_id_on_new_comment_creation"
                CHECK ((category_id <> 'new-comment-creation') OR (category_id = 'new-comment-creation' AND
                                                                   ((thread_id IS NOT NULL AND comment_id IS NULL) OR
                                                                    (thread_id IS NULL AND comment_id IS NOT NULL)))) NOT VALID;
      `,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // repopulating object_id is impossible unless we create a secondary table to store it since a lot of object_ids
      // are simply duds or incorrectly set
      await queryInterface.addColumn(
        'Subscriptions',
        'object_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Subscriptions"
        DROP CONSTRAINT IF EXISTS "chk_chain_id_on_chain_event",
        DROP CONSTRAINT IF EXISTS "chk_snapshot_id_on_snapshot_proposal",
        DROP CONSTRAINT IF EXISTS "chk_chain_id_on_new_thread",
        DROP CONSTRAINT IF EXISTS "chk_thread_id_comment_id_on_new_comment_creation",
        DROP CONSTRAINT IF EXISTS "chk_thread_id_comment_id_on_new_reaction";
    `,
        { transaction: t }
      );
    });
  },
};
