'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn(
        'ContestManagers',
        'neynar_webhook_id',
        { transaction },
      );
      await queryInterface.removeColumn(
        'ContestManagers',
        'neynar_webhook_secret',
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'ContestManagers',
        'neynar_webhook_id',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
      await queryInterface.addColumn(
        'ContestManagers',
        'neynar_webhook_secret',
        { type: Sequelize.STRING, allowNull: true },
        { transaction },
      );
    });
  },
};
