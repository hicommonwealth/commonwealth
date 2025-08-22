'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove the unique constraint on source and source_identifier columns
      await queryInterface.removeIndex(
        'MCPServers',
        'MCPServers_source_source_identifier_unique',
        {
          transaction,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Re-add the unique constraint on source and source_identifier columns
      await queryInterface.addIndex(
        'MCPServers',
        ['source', 'source_identifier'],
        {
          unique: true,
          name: 'MCPServers_source_source_identifier_unique',
          transaction,
        },
      );
    });
  },
};
