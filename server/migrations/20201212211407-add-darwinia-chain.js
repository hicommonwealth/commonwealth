'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'darwinia',
        symbol: 'RING',
        name: 'Darwinia',
        icon_url: '/static/img/protocols/ring.png',
        type: 'chain',
        network: 'darwinia',
        active: true,
        description: 'An open cross-chain bridge protocol based on Substrate.',
        telegram: 'https://t.me/DarwiniaNetwork',
        website: 'https://darwinia.network/',
        github: 'https://github.com/darwinia-network',
        collapsed_on_homepage: false,
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'darwinia',
        url: 'wss://cc1.darwinia.network/',
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'darwinia' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'darwinia' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'darwinia' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'darwinia' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'darwinia' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'darwinia' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['darwinia'] }, { transaction: t });
    });
  }
};
