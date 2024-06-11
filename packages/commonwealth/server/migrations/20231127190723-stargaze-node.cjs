'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://stargaze-rpc.publicnode.com:443',
          alt_wallet_url: 'https://stargaze-rest.publicnode.com',
        },
        {
          url: 'https://rpc.stargaze-apis.com/',
        },
        { transaction },
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
          url: 'https://stargaze-rpc.publicnode.com:443',
        },
        { transaction },
      );
    });
  },
};
