'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Tokens',
        'initial_supply',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'LaunchpadTrades',
        'price',
        {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.removeIndex(
        'LaunchpadTrades',
        'launchpad_trades_token_address',
        {
          transaction,
        },
      );
      await queryInterface.addIndex(
        'LaunchpadTrades',
        ['token_address', 'timestamp'],
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Tokens',
        'initial_supply',
        {
          type: Sequelize.NUMERIC(78, 0),
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.changeColumn(
        'LaunchpadTrades',
        'price',
        {
          type: Sequelize.NUMERIC(78, 0),
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.addIndex('LaunchpadTrades', ['token_address'], {
        transaction,
      });
      await queryInterface.removeIndex(
        'LaunchpadTrades',
        'launchpad_trades_token_address_timestamp',
        { transaction },
      );
    });
  },
};
