'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'Chains',
        {
          symbol: 'ION',
          network: 'ion',
          base: 'cosmos',
          bech32_prefix: 'osmo',
        },
        {
          id: 'ion',
        },
        { transaction: t }
      );

      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://rpc-osmosis.blockapsis.com',
          alt_wallet_url: 'https://lcd-osmosis.blockapsis.com',
        },
        {
          chain: 'ion',
        },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'Roles',
        {
          chain_id: 'ion',
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkUpdate(
        'Chains',
        {
          symbol: 'ETH',
          network: 'ethereum',
          base: 'ethereum',
        },
        {
          id: 'ion',
        },
        { transaction: t }
      );

      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
          alt_wallet_url:
            'https://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr',
        },
        {
          chain: 'ion',
        },
        { transaction: t }
      );
    });
  },
};
