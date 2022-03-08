'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'injective',
            symbol: 'INJ',
            name: 'Injective',
            icon_url: '/static/img/protocols/injective.png',
            type: 'chain',
            network: 'injective',
            base: 'cosmos',
            active: true,
            description: 'Access Limitless DeFi Markets with Zero Barriers.',
            website: 'https://injectiveprotocol.com/',
            discord: 'https://discord.com/invite/NK4qdbv',
            github: 'https://github.com/InjectiveLabs/',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'injective',
            url: 'https://staking-lcd.injective.network',
          },
        ],
        { transaction: t }
      );
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete(
        'ChainNodes',
        { chain: 'injective' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['injective'] },
        { transaction: t }
      );
    });
  },
};
