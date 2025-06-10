'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
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
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('MCPServerCommunities');
  },
};
