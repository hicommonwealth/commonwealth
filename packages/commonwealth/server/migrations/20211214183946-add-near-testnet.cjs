'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'near-testnet',
            symbol: 'NEAR',
            name: 'NEAR Testnet',
            icon_url: '/static/img/protocols/near.png',
            type: 'chain',
            network: 'near-testnet',
            base: 'near',
            active: true,
            description: '',
            website: '',
            discord: '',
            github: '',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'near-testnet',
            url: 'https://rpc.testnet.near.org',
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
        { chain: 'near-testnet' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['near-testnet'] },
        { transaction: t }
      );
    });
  },
};
