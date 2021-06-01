'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'aave',
        symbol: 'AAVE',
        name: 'Aave',
        icon_url: '/static/img/protocols/aave.png',
        type: 'dao',
        network: 'aave',
        base: 'ethereum',
        active: true,
        collapsed_on_homepage: false,
      }, {
        id: 'aave-testnet',
        symbol: 'TESTAAVE',
        name: 'Aave Testnet (Kovan)',
        icon_url: '/static/img/protocols/aave.png',
        type: 'dao',
        network: 'aave-testnet',
        base: 'ethereum',
        active: false,
        collapsed_on_homepage: true,
      }
      ], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'aave',
        url: 'wss://mainnet.infura.io/ws',
        address: '0xEC568fffba86c094cf06b22134B23074DFE2252c', // Governance
      },
      {
        chain: 'aave-testnet',
        url: 'wss://kovan.infura.io/ws',
        address: '0xc2ebab3bac8f2f5028f5c7317027a41ebfca31d2', // Governance
      }
      ], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'aave' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'aave' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'aave' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'aave' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'aave' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'aave' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['aave'] }, { transaction: t });

      await queryInterface.bulkDelete('OffchainReactions', { chain: 'aave-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'aave-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'aave-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'aave-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'aave-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'aave-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['aave-testnet'] }, { transaction: t });
    });
  }
};
