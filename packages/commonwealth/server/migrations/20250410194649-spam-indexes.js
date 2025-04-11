'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Update Threads.title index
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS threads_title_trgm_idx;

        CREATE INDEX threads_title_trgm_idx
        ON "Threads" USING gin (title gin_trgm_ops)
        WHERE marked_as_spam_at IS NULL;
      `,
        { transaction },
      );

      // Update Threads.search column + index
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS "OffchainThreads_search";

        ALTER TABLE "Threads"
        ALTER COLUMN search DROP NOT NULL;

        UPDATE "Threads"
        SET search = null
        WHERE marked_as_spam_at IS NULL;

        CREATE INDEX threads_search
        ON "Threads" USING gin(search)
        WHERE marked_as_spam_at IS NULL;
      `,
        { transaction },
      );

      // Update Comments.search column + index
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS comments_search;

        ALTER TABLE "Comments"
        ALTER COLUMN search DROP NOT NULL;

        UPDATE "Comments"
        SET search = null
        WHERE marked_as_spam_at IS NULL;

        CREATE INDEX comments_search
        ON "Comments" USING gin(search)
        WHERE marked_as_spam_at IS NULL;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
