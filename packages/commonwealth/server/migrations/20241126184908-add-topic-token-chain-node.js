'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Topics', 'chain_node_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ChainNodes',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Topics', 'chain_node_id');
  },
};
