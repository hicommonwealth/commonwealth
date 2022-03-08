'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Notional
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'ideamarket-testnet',
            symbol: 'IDT',
            name: 'Ideamarket Testnet',
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
            chain: 'ideamarket-testnet',
            url: 'wss://arb-rinkeby.g.alchemy.com/v2/WLfTX_HT-26kIjsBaBx7CrTHEi45v212',
            address: '0x634a0900a5F90C9F2d42BF1d49d94B84Db0A260d',
            eth_chain_id: 421611,
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
        { chain: 'ideamarket-testnet' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'ideamarket-testnet' },
        { transaction: t }
      );
    });
  },
};
