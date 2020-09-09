'use strict';
module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('HistoricalValidatorStats', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, //primary-key
      stash_id: { type: DataTypes.STRING, allowNull: false, references: { model: 'Validators', key: 'stash' } },
      name: { type: DataTypes.STRING },
      block: { type: DataTypes.STRING, allowNull: false }, // blocknumber
      exposure: { type: DataTypes.JSON, allowNull: false },
      commissionPer: { type: DataTypes.FLOAT, allowNull: false },
      apr: { type: DataTypes.FLOAT, allowNull: false },
      uptime: { type: DataTypes.STRING, allowNull: false },
      movingAverages: { type: DataTypes.INTEGER, allowNull: false },
      isLatest: { type: DataTypes.BOOLEAN, allowNull: false },
      hasMessage: { type: DataTypes.BOOLEAN, allowNull: false },
      isOnline: { type: DataTypes.BOOLEAN, allowNull: false },
      isElected: { type: DataTypes.BOOLEAN, allowNull: false },
      toBeElected: { type: DataTypes.BOOLEAN, allowNull: false },
      eraPoints: { type: DataTypes.INTEGER, allowNull: false },
      blockCount: { type: DataTypes.INTEGER, allowNull: false },
      otherTotal: { type: DataTypes.STRING, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true
    });

  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('HistoricalValidatorStats');
  }
};
