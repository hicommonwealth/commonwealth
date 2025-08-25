'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(
        'LaunchpadTokens',
        ['liquidity_transferred', 'created_at'],
        {
          name: 'LaunchpadTokens_liquidity_transferred_created_at',
          transaction,
          order: ['liquidity_transferred', 'created_at DESC'],
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'LaunchpadTokens',
        'LaunchpadTokens_liquidity_transferred_created_at',
        { transaction },
      );
    });
  },
};
