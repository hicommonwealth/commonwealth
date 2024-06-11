'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('read_only_roles_threads', {
      id: { type: Sequelize.INTEGER, allowNull: false },
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable('private_threads_roles', {
      id: { type: Sequelize.INTEGER, allowNull: false },
      thread_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addColumn('OffchainThreads', 'private', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn('OffchainThreads', 'read_only', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('readOnlyRolesThreads');
    await queryInterface.dropTable('privateThreadsRoles');
    await queryInterface.removeColumn('OffchainThreads', 'private', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.removeColumn('OffchainThreads', 'read_only', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
