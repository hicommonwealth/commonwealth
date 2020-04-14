'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
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
    await queryInterface.addColumn('private', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('read_only', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
  },

  down: (queryInterface, DataTypes) => {
    await queryInterface.dropTable('read_only_roles_threads');
    await queryInterface.dropTable('private_threads_roles');
    await queryInterface.deleteColumn('private', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.deleteColumn('read_only', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

  }
};
