'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LastProcessedSolanaSlots', {
      chain_node_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        references: { model: 'ChainNodes', key: 'id' },
        onDelete: 'CASCADE',
      },
      slot_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('LastProcessedSolanaSlots');
  },
};
