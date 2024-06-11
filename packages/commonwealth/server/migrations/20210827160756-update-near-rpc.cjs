'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://rpc.mainnet.near.org',
        },
        {
          chain: 'near',
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
          url: 'https://rpc.nearprotocol.com',
        },
        {
          chain: 'near',
        },
        {
          transaction: t,
        }
      );
    });
  },
};
