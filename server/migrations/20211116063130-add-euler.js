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
            url: 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr', 
            address: '', // GovernorAlpha
            token_name: 'EUL', // for alpha/bravo
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
