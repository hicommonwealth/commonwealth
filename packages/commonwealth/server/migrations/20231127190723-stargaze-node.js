'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://rpc-stargaze.pupmos.network',
          alt_wallet_url: 'https://api-stargaze.pupmos.network',
        },
        {
          url: 'https://rpc.stargaze-apis.com/',
        },
        { transaction: t },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://rpc.stargaze-apis.com/',
          alt_wallet_url: 'https://rest.stargaze-apis.com/',
        },
        {
          url: 'https://rpc-stargaze.pupmos.network',
        },
        { transaction: t },
      );
    });
  },
};
