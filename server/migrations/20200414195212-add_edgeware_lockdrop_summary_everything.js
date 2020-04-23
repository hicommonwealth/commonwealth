'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('EdgewareLockdropEverythings', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      createdAt: { type: DataTypes.DATE },
      data: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      underscored: true,
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('EdgewareLockdropEverythings');
  }
};
