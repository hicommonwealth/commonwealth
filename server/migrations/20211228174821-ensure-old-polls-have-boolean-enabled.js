'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "OffchainThreads" 
      SET offchain_voting_enabled = true 
      WHERE offchain_voting_ends_at IS NOT NULL`);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `UPDATE "OffchainThreads" 
      SET offchain_voting_enabled = NULL`);
  }
};
