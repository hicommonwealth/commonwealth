'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS OffchainThreads_vector_update ON "Threads";
    `);
      await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS OffchainComments_vector_update ON "Comments";
    `);
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
