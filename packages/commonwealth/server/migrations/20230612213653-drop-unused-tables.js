'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // drop unused columns
      await queryInterface.removeColumn('Chains', 'default_allow_permissions', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'default_deny_permissions', {
        transaction: t,
      });

      // drop unused tables
      await queryInterface.dropTable('RoleAssignments', { transaction: t });
      await queryInterface.dropTable('CommunityRoles', { transaction: t });
      await queryInterface.dropTable('Roles', { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
