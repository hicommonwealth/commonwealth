'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Notifications', {
      fields: ['chain_event_id'],
      prefix: 'new',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Notifications', {
      fields: ['chain_event_id'],
      prefix: 'new',
    });
  },
};
