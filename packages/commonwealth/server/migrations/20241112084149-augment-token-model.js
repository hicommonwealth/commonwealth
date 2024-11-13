'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Tokens',
        'is_locked',
        'liquidity_transferred',
        {
          transaction,
        },
      );
      await queryInterface.addColumn(
        'Tokens',
        'launchpad_liquidity',
        {
          type: Sequelize.DECIMAL(78, 0),
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'Tokens',
        'eth_market_cap_target',
        {
          type: Sequelize.FLOAT,
          allowNull: false,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn(
        'Tokens',
        'liquidity_transferred',
        'is_locked',
        {
          transaction,
        },
      );
      await queryInterface.removeColumn('Tokens', 'eth_market_cap_target', {
        transaction,
      });
      await queryInterface.removeColumn('Tokens', 'launchpad_liquidity', {
        transaction,
      });
    });
  },
};
