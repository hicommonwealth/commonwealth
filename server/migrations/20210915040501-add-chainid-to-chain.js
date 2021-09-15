'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Chains', 'chain_id', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await queryInterface.bulkUpdate('Chains', { chain_id: 1 }, { type: 'token' }, { transaction });
      await queryInterface.bulkUpdate('Chains', { chain_id: 1 }, { type: 'dao', network: 'aave' }, { transaction });
      await queryInterface.bulkUpdate('Chains', { chain_id: 1 }, { type: 'dao', network: 'compound' }, { transaction });
      await queryInterface.bulkUpdate('Chains', { chain_id: 1 }, { type: 'dao', network: 'marlin-testnet' }, { transaction });
      await queryInterface.bulkUpdate('Chains', { chain_id: 1 }, { type: 'dao', network: 'metacartel' }, { transaction });
    });
  },

  down: (queryInterface) => {
    return queryInterface.removeColumn(
      'Chains',
      'chain_id'
    );
  }
};
