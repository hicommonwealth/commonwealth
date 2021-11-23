'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Notional
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'euler-finance',
            symbol: 'EUL',
            name: 'Euler Finance',
            type: 'dao',
            network: 'compound',
            base: 'ethereum',
            active: true,
            has_chain_events_listener: true,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'euler-finance',
            eth_chain_id: 3,
            url: 'wss://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7',
            address: '0xD2B07E433e4F9dda20E4a523b2A60c23c7b1344C', // Testnet OZ gov contract
            token_name: 'token', // for bravo/oz
          },
        ],
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'euler-finance' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'euler-finance' },
        { transaction: t }
      );
    });
  }
};
