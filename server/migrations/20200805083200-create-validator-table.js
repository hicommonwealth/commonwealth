'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('Validators', {
      stash: { type: DataTypes.STRING, allowNull: false, primaryKey: true }, //AccountID
      controller: { type: DataTypes.STRING, allowNull: false }, // AccountId
      sessionKeys: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false }, //AccountID[]
      state: { type: DataTypes.STRING, allowNull: false }, //Active/waiting/inactive
      lastUpdate: { type: DataTypes.INTEGER, allowNull: false },//blocknumber
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('Validators');
  }
};

