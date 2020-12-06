'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('HistoricalValidatorStatistic', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }, // primary-key
      stash: { type: Sequelize.STRING, allowNull: false,  references: { model: 'Validator', key: 'stash' } },
      name: { type: Sequelize.STRING, allowNull: true },
      block: { type: Sequelize.STRING, allowNull: false }, // blocknumber
      exposure: { type: Sequelize.JSON, allowNull: false },
      commissionPer: { type: Sequelize.FLOAT, allowNull: false },
      apr: { type: Sequelize.FLOAT, allowNull: false },
      uptime: { type: Sequelize.STRING, allowNull: false },
      hasMessage: { type: Sequelize.BOOLEAN, allowNull: false },
      isOnline: { type: Sequelize.BOOLEAN, allowNull: false },
      eraPoints: { type: Sequelize.INTEGER, allowNull: false },
      isElected: { type: Sequelize.BOOLEAN, allowNull: false },
      toBeElected: { type: Sequelize.BOOLEAN, allowNull: false },
      eventType: { type: Sequelize.STRING, allowNull: false },
      rewardsStats: { type: Sequelize.JSONB, allowNull: false },
      slashesStats: { type: Sequelize.JSONB, allowNull: false },
      offencesStats: { type: Sequelize.JSONB, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    }, {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('HistoricalValidatorStatistic');
  }
};
