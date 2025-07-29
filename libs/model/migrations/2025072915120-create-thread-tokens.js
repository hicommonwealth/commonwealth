'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'ThreadTokens',
        {
          token_address: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
          },
          thread_id: { type: Sequelize.INTEGER, allowNull: false },
          name: { type: Sequelize.STRING, allowNull: false },
          symbol: { type: Sequelize.STRING, allowNull: false },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
          initial_supply: { type: Sequelize.INTEGER, allowNull: false },
          liquidity_transferred: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          launchpad_liquidity: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
          },
          eth_market_cap_target: { type: Sequelize.DOUBLE, allowNull: false },
          creator_address: { type: Sequelize.STRING },
        },
        { transaction },
      );

      await queryInterface.createTable(
        'ThreadTokenTrades',
        {
          eth_chain_id: { type: Sequelize.INTEGER, allowNull: false },
          transaction_hash: { type: Sequelize.STRING, allowNull: false },
          token_address: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'ThreadTokens',
              key: 'token_address',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          trader_address: { type: Sequelize.STRING, allowNull: false },
          is_buy: { type: Sequelize.BOOLEAN, allowNull: false },
          community_token_amount: {
            type: Sequelize.DECIMAL(78, 0),
            allowNull: false,
          },
          price: { type: Sequelize.DOUBLE, allowNull: false },
          floating_supply: { type: Sequelize.DECIMAL(78, 0), allowNull: false },
          timestamp: { type: Sequelize.INTEGER, allowNull: false },
        },
        { transaction },
      );

      await queryInterface.addConstraint('ThreadTokenTrades', {
        fields: ['eth_chain_id', 'transaction_hash'],
        type: 'primary key',
        name: 'ThreadTokenTrades_pkey',
        transaction,
      });

      await queryInterface.addIndex(
        'ThreadTokenTrades',
        ['token_address', 'timestamp'],
        {
          name: 'thread_token_trades_token_address_timestamp',
          transaction,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ThreadTokenTrades');
    await queryInterface.dropTable('ThreadTokens');
  },
};
