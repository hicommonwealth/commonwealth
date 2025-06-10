'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mcp_server_communities', {
      mcp_server_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'mcp_servers',
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

    await queryInterface.addIndex('mcp_server_communities', {
      fields: ['mcp_server_id'],
      name: 'mcp_server_communities_mcp_server_id_index',
    });

    await queryInterface.addIndex('mcp_server_communities', {
      fields: ['community_id'],
      name: 'mcp_server_communities_community_id_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('mcp_server_communities');
  },
};
