'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Dlq', {
      consumer: { type: Sequelize.STRING, allowNull: false, primaryKey: true },
      event_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      event_name: { type: Sequelize.STRING, allowNull: false },
      reason: { type: Sequelize.STRING, allowNull: false },
      timestamp: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Dlq');
  },
};
