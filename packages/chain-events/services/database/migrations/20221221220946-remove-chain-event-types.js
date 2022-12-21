'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ChainEventTypes');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ChainEventTypes', {
      // id = chain-event_name (event_name is value of string enum)
      id: { type: Sequelize.STRING, primaryKey: true },
      chain: { type: Sequelize.STRING, allowNull: false },
      // should never be null, but added here for migration purposes
      event_network: { type: Sequelize.STRING, allowNull: true },
      event_name: { type: Sequelize.STRING, allowNull: false },
      queued: { type: Sequelize.SMALLINT, allowNull: false, defaultValue: 0 },
    });
  }
};
