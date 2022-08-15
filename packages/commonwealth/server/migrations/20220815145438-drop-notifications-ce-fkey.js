'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('Notifications', 'Notifications_chain_event_id_fkey1');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint('Notifications', {
      name: 'Notifications_chain_event_id_fkey1',
      type: 'FOREIGN KEY',
      fields: ['chain_event_id'],
      references: {
        table: 'ChainEvent',
        field: 'id'
      }
    })
  }
};
