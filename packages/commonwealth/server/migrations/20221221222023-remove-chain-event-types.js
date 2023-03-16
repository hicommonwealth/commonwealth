'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Subscriptions',
        'chain_event_type_id',
        { transaction: t }
      );
      await queryInterface.dropTable('ChainEventTypes', { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable(
        'ChainEventTypes',
        {
          // id = chain-event_name (event_name is value of string enum)
          id: { type: Sequelize.STRING, primaryKey: true },
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Subscriptions',
        'chain_event_type_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: { model: 'ChainEventTypes', key: 'id' },
        },
        { transaction: t }
      );
    });
  },
};
