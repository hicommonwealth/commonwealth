'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Notional
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'ideamarket',
            symbol: 'IMO',
            name: 'Ideamarket',
            type: 'token',
            network: 'erc20',
            base: 'ethereum',
            active: true,
            decimals: 18,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'ideamarket',
            url: 'wss://arb-mainnet.g.alchemy.com/v2/wJE2b7MRNJgk7S8dfgb_1xZNUDq7SF7G',
            address: '0xC6C77506134cFc29E62cF35cEb2b964bE313FBC9',
            eth_chain_id: 42161,
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
        { chain: 'ideamarket' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'ideamarket' },
        { transaction: t }
      );
    });
  },
};
