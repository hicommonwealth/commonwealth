'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
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
    await queryInterface.createTable('read_only_roles_threads', {
      thread_id: {},
      
    });
    await queryInterface.createTable('private_threads_roles', {

    });
  },

  down: (queryInterface, DataTypes) => {
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
    await queryInterface.dropTable('read_only_roles_threads');
    await queryInterface.dropTable('private_threads_roles');
  }
};
