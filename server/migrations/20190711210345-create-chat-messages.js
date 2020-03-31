'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('ChatMessages', {
      address: { type: DataTypes.STRING, allowNull: false },
      chain: { type: DataTypes.STRING, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      room: { type: DataTypes.STRING, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('ChatMessages');
  }
};
