'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('HistoricalValidatorStats', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      stash_id: { type: DataTypes.STRING, allowNull: false, references: { model: 'Validators', key: 'stash' } },
      name: { type: DataTypes.STRING },
      blockNumber: { type: DataTypes.STRING, allowNull: false }, // blocknumber
      exposure: { type: DataTypes.JSON, allowNull: false },
      commissionPer: { type: DataTypes.FLOAT, allowNull: false },
      apr: { type: DataTypes.FLOAT, allowNull: false },
      uptime: { type: DataTypes.STRING, allowNull: false },
      toBeElected: { type: DataTypes.BOOLEAN, allowNull: false },
      eraPoints: { type: DataTypes.INTEGER, allowNull: false },
      createdAt: { type: DataTypes.DATE },
      updatedAt: { type: DataTypes.DATE },
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('HistoricalValidatorStats');
  }
};
