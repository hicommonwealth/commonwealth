'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainThreads',
        'offchain_voting_enabled',
        { type: Sequelize.BOOLEAN },
        { transaction: t }
      );
      await queryInterface.sequelize.query(
        `
        UPDATE "OffchainThreads" 
        SET offchain_voting_enabled = true 
        WHERE offchain_voting_ends_at IS NOT NULL`,
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'OffchainThreads',
      'offchain_voting_enabled'
    );
  },
};
