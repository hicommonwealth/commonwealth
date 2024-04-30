'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Subscriptions', 'chain_entity_id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Subscriptions', 'chain_entity_id', {
      type: Sequelize.STRING,
      allowNull: true,
      references: { model: 'ChainEntityMeta', key: 'id' },
    });
  },
};
