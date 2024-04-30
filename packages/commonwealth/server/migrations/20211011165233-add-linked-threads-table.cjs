'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable('LinkedThreads', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      linked_thread: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OffchainThreads',
          key: 'id',
        },
      },
      linking_thread: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'OffchainThreads',
          key: 'id',
        },
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable('LinkedThreads');
  },
};
