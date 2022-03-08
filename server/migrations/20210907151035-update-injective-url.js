'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://injective.cw-figment.workers.dev',
        },
        {
          chain: 'injective',
        },
        {
          transaction: t,
        }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://staking-lcd.injective.network',
        },
        {
          chain: 'injective',
        },
        {
          transaction: t,
        }
      );
    });
  },
};
