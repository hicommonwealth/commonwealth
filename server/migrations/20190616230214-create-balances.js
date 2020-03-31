'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Balances', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      address: { type: DataTypes.STRING, allowNull: false },
      balance: { type: DataTypes.STRING, allowNull: false },
      blocknum: { type: DataTypes.INTEGER, allowNull: false },
    }, {
      timestamps: false,
      underscored: true,
      indexes: [
        { fields: ['address'] },
      ],
    });
  },
  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Balances');
  }
};
