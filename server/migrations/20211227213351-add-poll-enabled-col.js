'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'OffchainThreads',
      'offchain_voting_enabled',
      {
        type: Sequelize.BOOLEAN,
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'OffchainThreads',
      'offchain_voting_enabled',
    );
  }
};
