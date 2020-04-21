'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('EdgewareLockdropEverythings', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      createdAt: { type: DataTypes.DATE, field: 'created_at' },
      data: { type: DataTypes.TEXT, allowNull: true },
    }, {
      underscored: true,
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('EdgewareLockdropEverythings');
  }
};
