'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'MCPServers',
        {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          description: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          handle: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          source: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          server_url: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'MCPServerCommunities',
        {
          mcp_server_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
              model: 'MCPServers',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          community_id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
            references: {
              model: 'Communities',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          created_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updated_at: {
            allowNull: false,
            type: Sequelize.DATE,
          },
        },
        { transaction },
      );

      await queryInterface.bulkInsert(
        'MCPServers',
        [
          {
            id: 1,
            name: 'Common MCP Server',
            description:
              'Provides access to data from the Common platform, such as communities, threads and comments.',
            handle: 'common',
            source: 'common',
            server_url: '',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction },
      );
    });

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(
        'MCPServers',
        {
          fields: ['name'],
          unique: true,
          name: 'MCPServers_name_unique',
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'MCPServerCommunities',
        {
          fields: ['mcp_server_id'],
          name: 'MCPServerCommunities_mcp_server_id_index',
        },
        { transaction },
      );

      await queryInterface.addIndex(
        'MCPServerCommunities',
        {
          fields: ['community_id'],
          name: 'MCPServerCommunities_community_id_index',
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('MCPServerCommunities', { transaction });
      await queryInterface.dropTable('MCPServers', { transaction });
    });
  },
};
