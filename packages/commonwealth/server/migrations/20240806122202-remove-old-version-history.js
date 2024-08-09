'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'version_history', {
        transaction,
      });
      await queryInterface.removeColumn('Threads', 'version_history_updated', {
        transaction,
      });
      await queryInterface.removeColumn('Comments', 'version_history', {
        transaction,
      });
      await queryInterface.removeColumn('Comments', 'version_history_updated', {
        transaction,
      });
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
