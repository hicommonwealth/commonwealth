'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addConstraint('MCPServers', {
        fields: ['auth_user_id'],
        type: 'foreign key',
        name: 'MCPServers_auth_user_id_fkey',
        references: {
          table: 'Users',
          field: 'id',
        },
        onUpdate: 'NO ACTION',
        onDelete: 'NO ACTION',
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeConstraint(
        'MCPServers',
        'MCPServers_auth_user_id_fkey',
        { transaction },
      );
    });
  },
};
