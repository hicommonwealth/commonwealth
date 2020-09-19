'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('HistoricalValidatorStatistic', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }, // primary-key
      stash: { type: DataTypes.STRING, allowNull: false, references: { model: 'Validator', key: 'stash' } },
      name: { type: DataTypes.STRING },
      block: { type: DataTypes.STRING, allowNull: false }, // blocknumber
      exposure: { type: DataTypes.JSON, allowNull: false },
      commissionPer: { type: DataTypes.FLOAT, allowNull: false },
      apr: { type: DataTypes.FLOAT, allowNull: false },
      uptime: { type: DataTypes.STRING, allowNull: false },
      hasMessage: { type: DataTypes.BOOLEAN, allowNull: false },
      isOnline: { type: DataTypes.BOOLEAN, allowNull: false },
      isElected: { type: DataTypes.BOOLEAN, allowNull: false },
      toBeElected: { type: DataTypes.BOOLEAN, allowNull: false },
      eraPoints: { type: DataTypes.INTEGER, allowNull: false },
      eventType: { type: DataTypes.STRING, allowNull: false },
      rewardsStats: { type: dataTypes.JSONB, allowNull: false },
      slashesStats: { type: dataTypes.JSONB, allowNull: false },
      offencesStats: { type: dataTypes.JSONB, allowNull: false },  
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.dropTable('HistoricalValidatorStatistic');
  }
};
