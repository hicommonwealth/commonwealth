'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Topics', 'chain_node_id');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Topics', 'chain_node_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ChainNodes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
    });
  },
};
