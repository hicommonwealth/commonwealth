'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LaunchpadTrades', {
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
      namespace: {
        type: Sequelize.STRING,
        references: {
          model: 'Communities',
          key: 'namespace',
        },
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('LaunchpadTrades');
  },
};
