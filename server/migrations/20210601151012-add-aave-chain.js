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
        id: 'dydx-ropsten',
        network: 'aave',
        symbol: 'DYDX',
        name: 'DYDX (ropsten)',
        icon_url: '/static/img/protocols/dydx.jpg',
        active: true,
        type: 'dao',
        base: 'ethereum',
        collapsed_on_homepage: false,
      }
      ], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'aave',
        url: 'wss://mainnet.infura.io/ws',
        address: '0xEC568fffba86c094cf06b22134B23074DFE2252c', // Governance
      },
      {
        chain: 'dydx-ropsten',
        url: 'wss://ropsten.infura.io/ws',
        address: '0x6938240Ba19cB8a614444156244b658f650c8D5c', // Governance
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

      await queryInterface.bulkDelete('OffchainReactions', { chain: 'dydx-ropsten' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'dydx-ropsten' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'dydx-ropsten' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'dydx-ropsten' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'dydx-ropsten' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'dydx-ropsten' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['dydx-ropsten'] }, { transaction: t });
    });
  }
};
