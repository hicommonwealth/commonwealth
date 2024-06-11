'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('EdgewareLockdropBalances');
    await queryInterface.dropTable('EdgewareLockdropEvents');
    await queryInterface.dropTable('EdgewareLockdropEverythings');
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
