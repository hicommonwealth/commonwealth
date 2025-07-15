'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `DELETE FROM "RoleAssignments" WHERE deleted_at IS NOT NULL;`,
        { transaction: t }
      );
      await queryInterface.removeColumn('RoleAssignments', 'deleted_at', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'RoleAssignments',
        'deleted_at',
        { type: Sequelize.DATE },
        {
          transaction: t,
        }
      );
    });
  },
};
