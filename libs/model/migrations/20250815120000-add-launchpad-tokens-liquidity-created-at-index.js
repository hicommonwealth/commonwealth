'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Index for liquidity_transferred
      const liquidityIndex = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'LaunchpadTokens_liquidity_transferred'`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      if (liquidityIndex.length === 0) {
        await queryInterface.addIndex(
          'LaunchpadTokens',
          ['liquidity_transferred'],
          {
            name: 'LaunchpadTokens_liquidity_transferred',
            transaction,
          },
        );
      }

      // Index for created_at DESC (latest first)
      const createdAtIndex = await queryInterface.sequelize.query(
        `SELECT indexname FROM pg_indexes WHERE indexname = 'LaunchpadTokens_created_at_desc'`,
        { type: Sequelize.QueryTypes.SELECT, transaction },
      );
      if (createdAtIndex.length === 0) {
        await queryInterface.addIndex(
          'LaunchpadTokens',
          ['created_at'],
          {
            name: 'LaunchpadTokens_created_at_desc',
            transaction,
            order: [['created_at', 'DESC']],
          },
        );
      }
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

