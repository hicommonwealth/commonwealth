'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('read_only_roles_threads', {
      id: { type: DataTypes.INTEGER, allowNull: false },
      thread_id: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.createTable('private_threads_roles', {
      id: { type: DataTypes.INTEGER, allowNull: false },
      thread_id: { type: DataTypes.INTEGER, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addColumn(
      'OffchainThreads',
      'private',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
    await queryInterface.addColumn(
      'OffchainThreads',
      'read_only',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('readOnlyRolesThreads');
    await queryInterface.dropTable('privateThreadsRoles');
    await queryInterface.removeColumn(
      'OffchainThreads',
      'private',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
    await queryInterface.removeColumn(
      'OffchainThreads',
      'read_only',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    );
  }
};
