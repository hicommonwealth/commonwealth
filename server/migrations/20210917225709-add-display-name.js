'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Chains', 'display_name', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
      await queryInterface.addColumn('OffchainCommunities', 'display_name', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Chains', 'display_name');
      await queryInterface.removeColumn('OffchainCommunities', 'display_name');
    });
  }
};
