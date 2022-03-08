'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            base: 'substrate',
            id: 'clover',
            symbol: 'CLV',
            name: 'Clover Finance',
            icon_url: '/static/img/protocols/clover.png',
            type: 'chain',
            network: 'clover',
            active: true,
            ss58_prefix: 42,
            description:
              'An open cross-chain bridge protocol based on Substrate.',
            telegram: 'https://t.me/clover_en',
            website: 'https://clover.finance/',
            github: 'https://github.com/clover-network',
            collapsed_on_homepage: false,
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'clover',
            url: 'ws://api.clover.finance/',
          },
        ],
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'OffchainReactions',
        { chain: 'clover' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'clover' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'clover' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'clover' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'clover' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'clover' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['clover'] },
        { transaction: t }
      );
    });
  },
};
