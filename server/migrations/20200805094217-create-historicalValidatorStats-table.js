'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('HistoricalValidatorStats', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, //primary-key
      stash_id: { type: DataTypes.STRING, allowNull: false, references: { model: 'Validators', key: 'stash' } },
      block: { type: DataTypes.STRING, allowNull: false }, // blocknumber
      exposure: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false },
      commission: { type: DataTypes.STRING, allowNull: false },
      preferences: { type: DataTypes.INTEGER, allowNull: false },// preferences - ValidatorPrefs
      apr: { type: DataTypes.STRING, allowNull: false },
      uptime: { type: DataTypes.STRING, allowNull: false },
      movingAverages: { type: DataTypes.INTEGER, allowNull: false },
      isLatest: { type: dataTypes.BOOLEAN, allowNull: false },
      hasMessage: { type: dataTypes.BOOLEAN, allowNull: false },
      isOnline: { type: dataTypes.BOOLEAN, allowNull: false },
      eraPoints: { type: dataTypes.INTEGER, allowNull: false },
      createdAt: {
        type: DataTypes.DATE
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('HistoricalValidatorStats');
  }
};
