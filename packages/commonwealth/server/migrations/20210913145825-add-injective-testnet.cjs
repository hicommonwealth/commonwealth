'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'injective-testnet',
            symbol: 'tINJ',
            name: 'Injective Testnet',
            icon_url: '/static/img/protocols/injective.png',
            type: 'chain',
            network: 'injective-testnet',
            base: 'cosmos',
            active: false,
            description: 'Injective testnet.',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'injective-testnet',
            url: 'https://injective-rpc-testnet.cw-figment.workers.dev',
          },
        ],
        { transaction: t }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'injective-testnet' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['injective-testnet'] },
        { transaction: t }
      );
    });
  },
};
