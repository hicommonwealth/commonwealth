'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'sushi',
        symbol: 'SUSHI',
        name: 'Sushi',
        icon_url: '/static/img/protocols/sushi.png',
        type: 'chain',
        network: 'sushi',
        active: true,
        description: 'An example of an automated market maker (AMM).',
        telegram: 'https://t.me/sushiswapEG',
        website: 'https://sushi.com',
        discord: 'https://discord.com/invite/MsVBwEc',
        github: 'https://github.com/sushiswap',
        collapsed_on_homepage: false,
        base: 'ethereum',
        snapshot: 'sushi'
      }
    ], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'sushi',
        url: 'wss://mainnet.infura.io/ws',
        address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2'
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'sushi' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'sushi' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'sushi' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'sushi' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'sushi' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'sushi' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['sushi'] }, { transaction: t });
    });
  }
};
