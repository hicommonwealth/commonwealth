'use strict';

const tablesWithChainIdColumn = ['Groups', 'Polls']

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of tablesWithChainIdColumn) {
        await queryInterface.renameColumn(table, 'chain_id', 'community_id', { transaction });
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      for (const table of tablesWithChainIdColumn) {
        await queryInterface.renameColumn(table, 'community_id', 'chain_id', { transaction });
      }
    })
  }
};
