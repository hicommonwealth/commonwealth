'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      queryInterface.createTable('Tokens', {
        id: { type: Sequelize.STRING, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: false },
        address: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
        symbol: { type: Sequelize.STRING, allowNull: false },
        decimals: { type: Sequelize.INTEGER, allowNull: false },
        icon_url: { type: Sequelize.STRING, allowNull: true },
      }, { transaction: t });
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      queryInterface.dropTable('Tokens', { transaction: t });
    });
  }
};
