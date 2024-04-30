'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'crust',
            symbol: 'CRUST',
            name: 'Crust',
            icon_url: '/static/img/protocols/dot.png', // @TODO: Add crust
            type: 'chain',
            network: 'crust',
            base: 'substrate',
            active: true,
            description:
              'A Decentralized Cloud Blockchain Technology on Polkadot',
            telegram: 'https://t.me/CrustNetwork',
            website: 'https://crust.network/',
            discord: 'https://discord.com/invite/Jbw2PAUSCR',
            github: 'https://github.com/crustio',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'crust',
            url: 'wss://api.crust.network/',
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
        { chain: 'crust' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainComments',
        { chain: 'crust' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'OffchainThreads',
        { chain: 'crust' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Addresses',
        { chain: 'crust' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainEventTypes',
        { chain: 'crust' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'crust' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['crust'] },
        { transaction: t }
      );
    });
  },
};
