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
            url: 'wss://arb-rinkeby.g.alchemy.com/v2/WLfTX_HT-26kIjsBaBx7CrTHEi45v212', // TODO: Mainnet Arbitrum
            address: '0x...', // TODO: Mainnet Address
            eth_chain_id: 421611, // TODO: Verify
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
  }
};
