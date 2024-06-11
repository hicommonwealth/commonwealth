'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'terra',
            symbol: 'LUNA',
            name: 'Terra',
            icon_url: '/static/img/protocols/terra.png',
            type: 'chain',
            network: 'terra',
            base: 'cosmos',
            active: true,
            description:
              'Terra is a programmable money for the internet that is easier to spend, and more attractive to hold.',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'terra',
            url: 'https://terra.cw-figment.workers.dev',
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
        { chain: 'terra' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['terra'] },
        { transaction: t }
      );
    });
  },
};
