'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('PredictionMarkets', 'initial_liquidity', {
      type: Sequelize.DECIMAL(78, 0),
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('PredictionMarkets', 'initial_liquidity');
  },
};
