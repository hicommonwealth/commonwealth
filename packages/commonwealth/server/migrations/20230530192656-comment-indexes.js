'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // remove older root_id index, root_id no longer a column on Comments
      // add thread_id index used to fetch comments for a thread
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS "comments_thread_id" ON "Comments" ("thread_id");
        DROP INDEX IF EXISTS "offchain_comments_root_id";

        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
