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
        address: '0x61910ecd7e8e942136ce7fe7943f956cea1cc2f7', // Executor (long)
      },
      {
        chain: 'aave-testnet',
        url: 'wss://kovan.infura.io/ws',
        address: '0x7e5195b0A6a60b371Ba3276032CF6958eADFA652', // Executor (long)
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
