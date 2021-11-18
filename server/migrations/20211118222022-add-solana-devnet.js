'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      // Add Notional
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'solana-devnet',
            symbol: 'SOL',
            name: 'Solana Devnet',
            type: 'chain',
            network: 'solana-devnet',
            base: 'solana',
            active: true,
            decimals: 6,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'solana-devnet',
            url: 'devnet',
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
        { chain: 'solana-devnet' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'solana-devnet' },
        { transaction: t }
      );
    });
  }
};
