'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.dropTable('ChainObjects', { transaction: t }),
        queryInterface.dropTable('ChainObjectQueries', { transaction: t }),
        queryInterface.dropTable('ChainObjectVersions', { transaction: t }),
      ]);
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('ChainObjectVersions', {
        id: { type: DataTypes.STRING, primaryKey: true },  // unique identifying string
        chain: { type: DataTypes.STRING, allowNull: false, references: { model: 'Chains', key: 'id' } },
        unique_identifier: { type: DataTypes.STRING, allowNull: false },
        completion_field: { type: DataTypes.STRING, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
        deleted_at: DataTypes.DATE,
      }, { transaction: t });

      await queryInterface.createTable('ChainObjectQueries', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        object_type: { type: DataTypes.STRING, allowNull: false, references: { model: 'ChainObjectVersions', key: 'id' } },
        query_type: { type: DataTypes.ENUM('INIT', 'ADD', 'UPDATE'), allowNull: false },
        active: { type: DataTypes.BOOLEAN, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: false },
        query_url: { type: DataTypes.STRING, allowNull: false },
        query: { type: DataTypes.TEXT, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
        deleted_at: DataTypes.DATE,
        has_pagination: { type: DataTypes.BOOLEAN, allowNull: false, }
      }, { transaction: t });

      await queryInterface.createTable('ChainObjects', {
        id: { type: DataTypes.STRING, primaryKey: true }, // type + id
        object_type: { type: DataTypes.STRING, allowNull: false, references: { model: 'ChainObjectVersions', key: 'id' } },
        object_id: { type: DataTypes.STRING, allowNull: false },
        completed: { type: DataTypes.BOOLEAN, allowNull: false },
        object_data: { type: DataTypes.JSONB, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
        deleted_at: DataTypes.DATE,
      }, { transaction: t });
    });

    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addIndex('ChainObjectVersions', { fields: ['id'] }, { transaction: t });
      await queryInterface.addIndex('ChainObjectVersions', { fields: ['chain'] }, { transaction: t });

      await queryInterface.addIndex('ChainObjectQueries', { fields: ['id'] }, { transaction: t });
      await queryInterface.addIndex('ChainObjectQueries', { fields: ['object_type', 'query_type'] }, { transaction: t });

      await queryInterface.addIndex('ChainObjects', { fields: ['id'] }, { transaction: t });
      await queryInterface.addIndex('ChainObjects', { fields: ['object_type', 'object_id'] }, { transaction: t });
    });

    return new Promise((resolve, reject) => {
      resolve();
    });
  }
};
