'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn('Addresses', 'verification_token', {
          type: DataTypes.STRING, allowNull: false, defaultValue: 'MIGRATED',
        }, { transaction: t }),
        queryInterface.addColumn('Addresses', 'verification_token_expires', {
          type: DataTypes.DATE, allowNull: true,
        }, { transaction: t }),
        queryInterface.addColumn('Addresses', 'verified', {
          type: DataTypes.DATE, allowNull: true,
        }, { transaction: t }),

        queryInterface.addColumn('OffchainThreads', 'category_id', {
          type: DataTypes.INTEGER, allowNull: false,
        }, { transaction: t }),

        queryInterface.createTable('OffchainThreadCategories', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          name: { type: DataTypes.STRING, allowNull: false },
          description: { type: DataTypes.TEXT, allowNull: false },
          color: { type: DataTypes.STRING, allowNull: false },
          created_at: { type: DataTypes.DATE, allowNull: false },
          updated_at: { type: DataTypes.DATE, allowNull: false },
          deleted_at: DataTypes.DATE,
        }, { transaction: t }),

        queryInterface.createTable('Proposals', {
          id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
          chain: { type: DataTypes.STRING, allowNull: false },
          identifier: { type: DataTypes.STRING, allowNull: false },
          type: { type: DataTypes.STRING, allowNull: false },
          data: { type: DataTypes.JSON, allowNull: false },
          completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
          final_state: { type: DataTypes.JSON, allowNull: true },
          created_at: { type: DataTypes.DATE, allowNull: false },
          updated_at: { type: DataTypes.DATE, allowNull: false },
          deleted_at: DataTypes.DATE,
        }, { transaction: t }),
      ]).then(() => {
        queryInterface.changeColumn('Addresses', 'verification_token', {
          type: DataTypes.STRING, allowNull: false,
        });
      });
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Addresses', 'verification_token', { transaction: t }),
        queryInterface.removeColumn('Addresses', 'verification_token_expires', { transaction: t }),
        queryInterface.removeColumn('Addresses', 'verified', { transaction: t }),
        queryInterface.removeColumn('OffchainThreads', 'category_id', { transaction: t }),
        queryInterface.dropTable('OffchainThreadCategories', { transaction: t }),
        queryInterface.dropTable('Proposals', { transaction: t }),
      ]);
    });
  }
};
