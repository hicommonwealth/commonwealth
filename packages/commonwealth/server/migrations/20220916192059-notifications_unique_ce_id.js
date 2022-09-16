'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addConstraint('Notifications', {
            name: 'Notifications_unique_chain_event_id',
            fields: ['chain_event_id'],
            type: 'unique',
        });
    },

    down: async (queryInterface, Sequelize) => {
      await queryInterface.removeConstraint('Notifications', 'Notifications_unique_chain_event_id');
    }
};
