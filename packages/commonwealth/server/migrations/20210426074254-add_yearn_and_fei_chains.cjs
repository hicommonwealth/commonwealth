'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'yearn',
            symbol: 'YFI',
            name: 'Yearn',
            icon_url: '/static/img/protocols/yearn.png',
            type: 'chain',
            network: 'yearn',
            active: true,
            description:
              'A general-purpose confidential smart contract platform for DApps and DeFi.',
            telegram: 'https://t.me/yearnfinance',
            website: 'https://yearn.finance',
            discord: 'http://discord.yearn.finance',
            github: 'https://github.com/iearn-finance',
            collapsed_on_homepage: false,
            base: 'ethereum',
            snapshot: 'ybaby.eth',
          },
          {
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
            snapshot: 'fei.eth',
          },
          {
            id: 'demo',
            symbol: 'DEMO',
            name: 'demo',
            icon_url: '/static/img/protocols/eth.png',
            type: 'chain',
            network: 'demo',
            active: true,
            collapsed_on_homepage: false,
            base: 'ethereum',
            snapshot: 'polarcat.eth',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'yearn',
            url: 'wss://mainnet.infura.io/ws',
            address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
          },
          {
            chain: 'fei',
            url: 'wss://mainnet.infura.io/ws',
            address: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
          },
          {
            chain: 'demo',
            url: 'wss://ropsten.infura.io/ws',
            address: '0x89368d67c4fe7aebd22c9503566c3e563a2f586c',
          },
        ],
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'yearn' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['yearn'] },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'fei' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['fei'] },
        { transaction: t }
      );

      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'demo' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['demo'] },
        { transaction: t }
      );
    });
  },
};
