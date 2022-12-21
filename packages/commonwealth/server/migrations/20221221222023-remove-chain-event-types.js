'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ChainEventTypes');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ChainEventTypes', {
      // id = chain-event_name (event_name is value of string enum)
      id: { type: Sequelize.STRING, primaryKey: true },
    });
  }
};
