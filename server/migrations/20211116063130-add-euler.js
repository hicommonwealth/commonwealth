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
            base: 'binance', // TODO: BinanceSmartChain integration
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
            url: '', // TODO: Find provider for BSC
            address: '', // GovernorAlpha
            token_name: 'note', // for alpha/bravo
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
