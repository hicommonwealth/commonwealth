'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Chains', 'Communities', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        CREATE VIEW "Chains" AS SELECT * FROM "Communities";
      `,
        { transaction }
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
