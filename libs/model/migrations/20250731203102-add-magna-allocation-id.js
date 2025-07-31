'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'HistoricalAllocations',
      'magna_allocation_id',
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'HistoricalAllocations',
      'magna_allocation_id',
    );
  },
};
