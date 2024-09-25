'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
      DROP TRIGGER IF EXISTS "OffchainThreads_vector_update" ON "Threads";
    `,
        { transaction },
      );
      await queryInterface.renameColumn('Threads', '_search', 'search', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Threads"
        ALTER COLUMN search SET NOT NULL;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
      DROP TRIGGER IF EXISTS "OffchainComments_vector_update" ON "Comments";
    `,
        { transaction },
      );
      await queryInterface.renameColumn('Comments', '_search', 'search', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Comments"
        ALTER COLUMN search SET NOT NULL;
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
