'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('ChainEvents', 'chain_event_type_id', {
        transaction: t,
      });
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
          chain: { type: Sequelize.STRING, allowNull: false },
          // should never be null, but added here for migration purposes
          event_network: { type: Sequelize.STRING, allowNull: true },
          event_name: { type: Sequelize.STRING, allowNull: false },
          queued: {
            type: Sequelize.SMALLINT,
            allowNull: false,
            defaultValue: 0,
          },
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'ChainEvents',
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
