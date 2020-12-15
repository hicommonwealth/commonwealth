'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'centrifuge',
        symbol: 'RAD',
        name: 'Centrifuge',
        icon_url: '/static/img/protocols/rad.png',
        type: 'chain',
        network: 'centrifuge',
        active: true,
        description: 'The gateway for real-world assets into DeFi.',
        website: 'https://centrifuge.io/',
        chat: 'https://centrifuge.io/slack',
        github: 'https://github.com/centrifuge/',
        collapsed_on_homepage: false,
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'centrifuge',
        url: 'wss://fullnode.centrifuge.io/',
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'centrifuge' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'centrifuge' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'centrifuge' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'centrifuge' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'centrifuge' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'centrifuge' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['centrifuge'] }, { transaction: t });
    });
  }
};
