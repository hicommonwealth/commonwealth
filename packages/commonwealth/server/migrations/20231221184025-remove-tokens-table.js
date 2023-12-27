'use strict';

module.exports = {
  up: async (queryInterface) => {
    return queryInterface.dropTable('Tokens');
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('Tokens', {
      id: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      address: { type: Sequelize.STRING, allowNull: false },
      decimals: { type: Sequelize.INTEGER, allowNull: false },
      symbol: { type: Sequelize.STRING, allowNull: false },
      icon_url: { type: Sequelize.STRING(1024), allowNull: true },
      eth_chain_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    });
  },
};
