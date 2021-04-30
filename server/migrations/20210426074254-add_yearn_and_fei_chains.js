'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'yearn',
        symbol: 'YFI',
        name: 'Yearn',
        icon_url: '/static/img/protocols/yearn.png',
        type: 'chain',
        network: 'yearn',
        active: true,
        description: 'A general-purpose confidential smart contract platform for DApps and DeFi.',
        telegram: 'https://t.me/yearnfinance',
        website: 'https://yearn.finance',
        discord: 'http://discord.yearn.finance',
        github: 'https://github.com/iearn-finance',
        collapsed_on_homepage: false,
        base: 'ethereum',
        snapshot: 'ybaby.eth'
      }, {
        id: 'fei',
        symbol: 'FEI',
        name: 'fei',
        icon_url: '/static/img/protocols/fei.png',
        type: 'chain',
        network: 'fei',
        active: true,
        description: 'The stablecoin for DeFi.',
        telegram: 'https://t.me/feiprotocol',
        website: 'https://fei.money/',
        discord: 'https://discord.com/invite/2prhYdQ5jP',
        github: 'https://github.com/fei-protocol/fei-protocol-core',
        collapsed_on_homepage: false,
        base: 'ethereum',
        snapshot: 'fei.eth'
      }
    ], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'yearn',
        url: 'wss://mainnet.infura.io/ws',
      }, {
        chain: 'fei',
        url: 'wss://mainnet.infura.io/ws',
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('OffchainReactions', { chain: 'yearn' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'yearn' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'yearn' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'yearn' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'yearn' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'yearn' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['yearn'] }, { transaction: t });

      await queryInterface.bulkDelete('OffchainReactions', { chain: 'fei' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainComments', { chain: 'fei' }, { transaction: t });
      await queryInterface.bulkDelete('OffchainThreads', { chain: 'fei' }, { transaction: t });
      await queryInterface.bulkDelete('Addresses', { chain: 'fei' }, { transaction: t });
      await queryInterface.bulkDelete('ChainEventTypes', { chain: 'fei' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'fei' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['fei'] }, { transaction: t });
    });
  }
};
