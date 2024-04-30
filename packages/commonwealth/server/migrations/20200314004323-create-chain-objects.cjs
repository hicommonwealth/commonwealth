'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'ChainObjectVersions',
        {
          id: { type: Sequelize.STRING, primaryKey: true }, // unique identifying string
          chain: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'Chains', key: 'id' },
          },
          unique_identifier: { type: Sequelize.STRING, allowNull: false },
          completion_field: { type: Sequelize.STRING, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          deleted_at: Sequelize.DATE,
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'ChainObjectQueries',
        {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
          },
          object_type: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'ChainObjectVersions', key: 'id' },
          },
          query_type: {
            type: Sequelize.ENUM('INIT', 'ADD', 'UPDATE'),
            allowNull: false,
          },
          active: { type: Sequelize.BOOLEAN, allowNull: false },
          description: { type: Sequelize.TEXT, allowNull: false },
          query_url: { type: Sequelize.STRING, allowNull: false },
          query: { type: Sequelize.TEXT, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          deleted_at: Sequelize.DATE,
        },
        { transaction: t }
      );

      await queryInterface.createTable(
        'ChainObjects',
        {
          id: { type: Sequelize.STRING, primaryKey: true }, // type + id
          object_type: {
            type: Sequelize.STRING,
            allowNull: false,
            references: { model: 'ChainObjectVersions', key: 'id' },
          },
          object_id: { type: Sequelize.STRING, allowNull: false },
          completed: { type: Sequelize.BOOLEAN, allowNull: false },
          object_data: { type: Sequelize.JSONB, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          deleted_at: Sequelize.DATE,
        },
        { transaction: t }
      );
    });

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex(
        'ChainObjectVersions',
        { fields: ['id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'ChainObjectVersions',
        { fields: ['chain'] },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'ChainObjectQueries',
        { fields: ['id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'ChainObjectQueries',
        { fields: ['object_type', 'query_type'] },
        { transaction: t }
      );

      await queryInterface.addIndex(
        'ChainObjects',
        { fields: ['id'] },
        { transaction: t }
      );
      await queryInterface.addIndex(
        'ChainObjects',
        { fields: ['object_type', 'object_id'] },
        { transaction: t }
      );
    });

    return new Promise((resolve, reject) => {
      resolve();
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.dropTable('ChainObjects', { transaction: t }),
        queryInterface.dropTable('ChainObjectQueries', { transaction: t }),
        queryInterface.dropTable('ChainObjectVersions', { transaction: t }),
      ]);
    });
  },
};
