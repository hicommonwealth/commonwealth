'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addIndex(
        'LaunchpadTokens',
        ['liquidity_transferred'],
        {
          name: 'LaunchpadTokens_liquidity_transferred',
          transaction,
        },
      );
      await queryInterface.removeIndex(
        'LaunchpadTrades',
        'launchpad_trades_token_address_timestamp',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS "launchpad_trades_token_address_timestamp"
        ON "LaunchpadTrades" (token_address, timestamp DESC);
      `,
        { transaction },
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
      await queryInterface.removeIndex(
        'LaunchpadTrades',
        'launchpad_trades_token_address_timestamp',
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS "launchpad_trades_token_address_timestamp"
        ON "LaunchpadTrades" (token_address, timestamp);
      `,
        { transaction },
      );
    });
  },
};
