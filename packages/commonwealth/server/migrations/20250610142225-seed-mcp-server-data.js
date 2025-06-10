'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('MCPServers', [
      {
        id: 1,
        name: 'Common MCP Server',
        description:
          'Provides access to data from the Common platform, such as communities, threads and comments.',
        handle: 'common',
        source: 'common',
        server_url: 'https://common.xyz/mcp',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('MCPServers', {
      id: 1,
    });
  },
};
