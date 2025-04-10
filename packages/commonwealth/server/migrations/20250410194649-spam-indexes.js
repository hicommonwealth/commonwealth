'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('Threads', 'threads_title_trgm_idx', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        CREATE INDEX threads_title_trgm_idx
        ON "Threads" USING gin (title gin_trgm_ops)
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
