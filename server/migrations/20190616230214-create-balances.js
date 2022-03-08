'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      'Balances',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: Sequelize.STRING, allowNull: false },
        balance: { type: Sequelize.STRING, allowNull: false },
        blocknum: { type: Sequelize.INTEGER, allowNull: false },
      },
      {
        timestamps: false,
        underscored: true,
        indexes: [{ fields: ['address'] }],
      }
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Balances');
  },
};
