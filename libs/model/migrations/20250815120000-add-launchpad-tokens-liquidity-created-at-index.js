'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Index for liquidity_transferred
      await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'LaunchpadTokens_liquidity_transferred'`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      await queryInterface.addIndex(
        'LaunchpadTokens',
        ['liquidity_transferred'],
        {
          name: 'LaunchpadTokens_liquidity_transferred',
          transaction,
        },
      );

      // Index for created_at DESC (latest first)
      await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'LaunchpadTokens_created_at_desc'`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      await queryInterface.addIndex('LaunchpadTokens', ['created_at'], {
        name: 'LaunchpadTokens_created_at_desc',
        transaction,
        order: [['created_at', 'DESC']],
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex(
        'LaunchpadTokens',
        'LaunchpadTokens_liquidity_transferred',
        { transaction },
      );
      await queryInterface.removeIndex(
        'LaunchpadTokens',
        'LaunchpadTokens_created_at_desc',
        { transaction },
      );
    });
  },
};
