'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('OffchainThreads', 'private', {
        transaction: t,
      });
      await queryInterface.dropTable('read_only_roles_threads', {
        transaction: t,
      });
      await queryInterface.dropTable('private_threads_roles', {
        transaction: t,
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainThreads',
        'private',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction: t }
      );
      await queryInterface.createTable(
        'read_only_roles_threads',
        {
          id: { type: Sequelize.INTEGER, allowNull: false },
          thread_id: { type: Sequelize.INTEGER, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );
      await queryInterface.createTable(
        'private_threads_roles',
        {
          id: { type: Sequelize.INTEGER, allowNull: false },
          thread_id: { type: Sequelize.INTEGER, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction: t }
      );
    });
  },
};
