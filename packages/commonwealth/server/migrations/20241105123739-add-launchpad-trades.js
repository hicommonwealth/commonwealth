'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'LaunchpadTrades',
        {
          eth_chain_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            primaryKey: true,
          },
          transaction_hash: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
          },
          token_address: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: 'Tokens',
              key: 'token_address',
            },
          },
          trader_address: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          is_buy: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
          },
          community_token_amount: {
            type: Sequelize.NUMERIC(78, 0),
            allowNull: false,
          },
          floating_supply: {
            type: Sequelize.NUMERIC(78, 0),
            allowNull: false,
          },
          timestamp: {
            type: Sequelize.INTEGER,
            allowNull: false,
          },
        },
        { transaction },
      );
      await queryInterface.addIndex('LaunchpadTrades', ['token_address'], {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LaunchpadTrades');
  },
};
