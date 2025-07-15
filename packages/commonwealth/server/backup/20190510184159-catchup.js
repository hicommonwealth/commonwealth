'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.addColumn(
          'Addresses',
          'verification_token',
          {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'MIGRATED',
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'Addresses',
          'verification_token_expires',
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction: t }
        ),
        queryInterface.addColumn(
          'Addresses',
          'verified',
          {
            type: Sequelize.DATE,
            allowNull: true,
          },
          { transaction: t }
        ),

        queryInterface.addColumn(
          'OffchainThreads',
          'category_id',
          {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
          { transaction: t }
        ),

        queryInterface.createTable(
          'OffchainThreadCategories',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
            },
            name: { type: Sequelize.STRING, allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: false },
            color: { type: Sequelize.STRING, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
            deleted_at: Sequelize.DATE,
          },
          { transaction: t }
        ),

        queryInterface.createTable(
          'Proposals',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
            },
            chain: { type: Sequelize.STRING, allowNull: false },
            identifier: { type: Sequelize.STRING, allowNull: false },
            type: { type: Sequelize.STRING, allowNull: false },
            data: { type: Sequelize.JSON, allowNull: false },
            completed: {
              type: Sequelize.BOOLEAN,
              allowNull: false,
              defaultValue: false,
            },
            final_state: { type: Sequelize.JSON, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
            deleted_at: Sequelize.DATE,
          },
          { transaction: t }
        ),
      ]).then(() => {
        queryInterface.changeColumn('Addresses', 'verification_token', {
          type: Sequelize.STRING,
          allowNull: false,
        });
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.removeColumn('Addresses', 'verification_token', {
          transaction: t,
        }),
        queryInterface.removeColumn('Addresses', 'verification_token_expires', {
          transaction: t,
        }),
        queryInterface.removeColumn('Addresses', 'verified', {
          transaction: t,
        }),
        queryInterface.removeColumn('OffchainThreads', 'category_id', {
          transaction: t,
        }),
        queryInterface.dropTable('OffchainThreadCategories', {
          transaction: t,
        }),
        queryInterface.dropTable('Proposals', { transaction: t }),
      ]);
    });
  },
};
