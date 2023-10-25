'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Chains', 'directory_page_enabled', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, {transaction: t});
      await queryInterface.addColumn('Chains', 'directory_page_chain_node_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      }, {transaction: t});
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Chains', 'directory_page_enabled');
    await queryInterface.removeColumn('Chains', 'directory_page_chain_node_id');
  }
};
