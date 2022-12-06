'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      // TODO: migrate existing chain-event-type subscriptions to entity subscriptions

      await queryInterface.removeColumn('Subscriptions', 'chain_event_type_id');
    })
  },

  down: async (queryInterface, Sequelize) => {
    // irreversible (chain-event-types are dropped in chain-events-database)
  }
};
