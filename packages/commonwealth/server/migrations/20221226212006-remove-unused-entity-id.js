'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subscriptions', 'chain_event_type_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptipons', 'chain_event_type_id', {
      type: Sequelize.STRING, allowNull: true, references: { model: 'ChainEventTypes', key: 'id'}
    });
  }
};
