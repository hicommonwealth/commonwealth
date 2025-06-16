'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MCPServers', {
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
    });

    await queryInterface.addIndex('MCPServers', {
      fields: ['name'],
      unique: true,
      name: 'MCPServers_name_unique',
    });

    await queryInterface.createTable('MCPServerCommunities', {
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
    });

    await queryInterface.addIndex('MCPServerCommunities', {
      fields: ['mcp_server_id'],
      name: 'MCPServerCommunities_mcp_server_id_index',
    });

    await queryInterface.addIndex('MCPServerCommunities', {
      fields: ['community_id'],
      name: 'MCPServerCommunities_community_id_index',
    });

    await queryInterface.bulkInsert('MCPServers', [
      {
        id: 1,
        name: 'Common MCP Server',
        description:
          'Provides access to data from the Common platform, such as communities, threads and comments.',
        handle: 'common',
        source: 'common',

        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('MCPServerCommunities');
    await queryInterface.dropTable('MCPServers');
  },
};
