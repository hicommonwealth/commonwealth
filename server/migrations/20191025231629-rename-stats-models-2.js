'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('StatsEvents', 'EdgewareLockdropEvents', { transaction: t });
      await queryInterface.renameTable('StatsBalances', 'EdgewareLockdropBalances', { transaction: t });

      await queryInterface.createTable('SupernovaLockdropBTCLocks', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: DataTypes.STRING, allowNull: false },
        balance: { type: DataTypes.STRING, allowNull: false },
        blocknum: { type: DataTypes.INTEGER, allowNull: false },
        timestamp: { type: DataTypes.DATE, allowNull: false },
      }, {
        timestamps: false,
        underscored: true,
        indexes: [
          { fields: ['address'] },
        ],
      }, {
        transaction: t,
      });

      await queryInterface.createTable('SupernovaLockdropETHLocks', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: DataTypes.STRING, allowNull: false },
        balance: { type: DataTypes.STRING, allowNull: false },
        blocknum: { type: DataTypes.INTEGER, allowNull: false },
        timestamp: { type: DataTypes.DATE, allowNull: false },
      }, {
        timestamps: false,
        underscored: true,
        indexes: [
          { fields: ['address'] },
        ],
      }, {
        transaction: t,
      });

      await queryInterface.createTable('SupernovaLockdropATOMLocks', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        address: { type: DataTypes.STRING, allowNull: false },
        balance: { type: DataTypes.STRING, allowNull: false },
        blocknum: { type: DataTypes.INTEGER, allowNull: false },
        timestamp: { type: DataTypes.DATE, allowNull: false },
      }, {
        timestamps: false,
        underscored: true,
        indexes: [
          { fields: ['address'] },
        ],
      }, {
        transaction: t,
      });
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable('EdgewareLockdropEvents', 'StatsEvents', { transaction: t });
      await queryInterface.renameTable('EdgewareLockdropBalances', 'StatsBalances', { transaction: t });
      await queryInterface.dropTable('SupernovaLockdropBTCLocks', { transaction: t });
      await queryInterface.dropTable('SupernovaLockdropETHLocks', { transaction: t });
      await queryInterface.dropTable('SupernovaLockdropATOMLocks', { transaction: t });
    });
  }
};
