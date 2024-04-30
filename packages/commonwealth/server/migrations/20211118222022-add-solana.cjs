'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'solana-devnet',
            symbol: 'SOL',
            name: 'Solana Devnet',
            icon_url: '/static/img/protocols/solana.png',
            type: 'chain',
            network: 'solana-devnet',
            base: 'solana',
            active: true,
            decimals: 9,
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
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'solana-testnet',
            symbol: 'SOL',
            name: 'Solana Testnet',
            icon_url: '/static/img/protocols/solana.png',
            type: 'chain',
            network: 'solana-testnet',
            base: 'solana',
            active: true,
            decimals: 9,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'solana-testnet',
            url: 'testnet',
          },
        ],
        { transaction: t }
      );
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'solana',
            symbol: 'SOL',
            name: 'Solana',
            icon_url: '/static/img/protocols/solana.png',
            type: 'chain',
            network: 'solana',
            base: 'solana',
            active: true,
            decimals: 9,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'solana',
            url: 'mainnet-beta',
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
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'solana-testnet' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'solana-testnet' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'solana' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: 'solana' },
        { transaction: t }
      );
    });
  },
};
