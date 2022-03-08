'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Notional
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'notional',
            symbol: 'NOTE',
            name: 'Notional',
            type: 'dao',
            network: 'compound',
            base: 'ethereum',
            snapshot: 'notional.eth',
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
            chain: 'notional',
            url: 'wss://mainnet.infura.io/ws',
            address: '0x086b4ecD75c494dD36641195E89c25373E06d7cB', // GovernorAlpha
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
        { chain: 'notional' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'notional' },
        { transaction: t }
      );
    });
  },
};
