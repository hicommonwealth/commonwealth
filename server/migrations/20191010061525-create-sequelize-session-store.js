'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Sessions', {
      sid: { type: DataTypes.STRING, primaryKey: true },
      expires: DataTypes.DATE,
      data: DataTypes.TEXT,
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Sessions');
  }
};
