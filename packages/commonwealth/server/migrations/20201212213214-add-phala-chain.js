'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'phala',
            symbol: 'PHA',
            name: 'Phala Network',
            icon_url: '/static/img/protocols/pha.png',
            type: 'chain',
            network: 'phala',
            active: false,
            description:
              'A general-purpose confidential smart contract platform for DApps and DeFi.',
            telegram: 'https://t.me/phalanetwork',
            website: 'https://phala.network',
            chat: 'https://discord.gg/myBmQu5',
            github: 'https://github.com/Phala-Network',
            collapsed_on_homepage: false,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'phala',
            url: 'wss://poc3.phala.network/',
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
        { chain: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'phala' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['phala'] },
        { transaction: t }
      );
    });
  },
};
