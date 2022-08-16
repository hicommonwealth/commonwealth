'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "ChainEventTypes"
        DROP COLUMN chain,
        DROP COLUMN event_name,
        DROP COLUMN event_network
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Nothing you can do
  }
};
