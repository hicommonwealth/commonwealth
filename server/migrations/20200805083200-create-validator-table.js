'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Validator', {
      stash: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, // AccountID
      name: { type: DataTypes.STRING },
      controller: { type: DataTypes.STRING, allowNull: false }, // AccountId
      sessionKeys: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false }, // AccountID[]
      state: { type: DataTypes.STRING, allowNull: false }, // Active/waiting/inactive
      lastUpdate: { type: DataTypes.BIGINT, allowNull: false }, // blocknumber
      created_at: {
        type: DataTypes.DATE
      },
      updated_at: {
        type: DataTypes.DATE
      }
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Validator');
  }
};
