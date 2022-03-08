'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable(
        'StatsEvents',
        'EdgewareLockdropEvents',
        { transaction: t }
      );
      await queryInterface.renameTable(
        'StatsBalances',
        'EdgewareLockdropBalances',
        { transaction: t }
      );

      await queryInterface.createTable(
        'SupernovaLockdropBTCLocks',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          address: { type: Sequelize.STRING, allowNull: false },
          balance: { type: Sequelize.STRING, allowNull: false },
          blocknum: { type: Sequelize.INTEGER, allowNull: false },
          timestamp: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: false,
          underscored: true,
          indexes: [{ fields: ['address'] }],
        },
        {
          transaction: t,
        }
      );

      await queryInterface.createTable(
        'SupernovaLockdropETHLocks',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          address: { type: Sequelize.STRING, allowNull: false },
          balance: { type: Sequelize.STRING, allowNull: false },
          blocknum: { type: Sequelize.INTEGER, allowNull: false },
          timestamp: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: false,
          underscored: true,
          indexes: [{ fields: ['address'] }],
        },
        {
          transaction: t,
        }
      );

      await queryInterface.createTable(
        'SupernovaLockdropATOMLocks',
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          address: { type: Sequelize.STRING, allowNull: false },
          balance: { type: Sequelize.STRING, allowNull: false },
          blocknum: { type: Sequelize.INTEGER, allowNull: false },
          timestamp: { type: Sequelize.DATE, allowNull: false },
        },
        {
          timestamps: false,
          underscored: true,
          indexes: [{ fields: ['address'] }],
        },
        {
          transaction: t,
        }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.renameTable(
        'EdgewareLockdropEvents',
        'StatsEvents',
        { transaction: t }
      );
      await queryInterface.renameTable(
        'EdgewareLockdropBalances',
        'StatsBalances',
        { transaction: t }
      );
      await queryInterface.dropTable('SupernovaLockdropBTCLocks', {
        transaction: t,
      });
      await queryInterface.dropTable('SupernovaLockdropETHLocks', {
        transaction: t,
      });
      await queryInterface.dropTable('SupernovaLockdropATOMLocks', {
        transaction: t,
      });
    });
  },
};
