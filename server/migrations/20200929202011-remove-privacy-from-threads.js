'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainThreads', 'private', { transaction: t },
      );
      await queryInterface.dropTable('read_only_roles_threads', { transaction: t });
      await queryInterface.dropTable('private_threads_roles', { transaction: t });
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainThreads', 'private',
        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction: t },
      );
      await queryInterface.createTable('read_only_roles_threads', {
        id: { type: DataTypes.INTEGER, allowNull: false },
        thread_id: { type: DataTypes.INTEGER, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
      }, { transaction: t });
      await queryInterface.createTable('private_threads_roles', {
        id: { type: DataTypes.INTEGER, allowNull: false },
        thread_id: { type: DataTypes.INTEGER, allowNull: false },
        created_at: { type: DataTypes.DATE, allowNull: false },
        updated_at: { type: DataTypes.DATE, allowNull: false },
      }, { transaction: t });
    });
  }
};
