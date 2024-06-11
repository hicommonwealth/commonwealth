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
      await queryInterface.addColumn(
        'Chains',
        'default_allow_permissions',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'default_deny_permissions',
        {
          type: Sequelize.BIGINT,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Chains', 'default_allow_permissions', {
        transaction,
      });
      await queryInterface.removeColumn('Chains', 'default_deny_permissions', {
        transaction,
      });
    });
  },
};
