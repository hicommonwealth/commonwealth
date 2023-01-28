'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert(
        'Chains',
        [
          {
            id: 'osmosis-local',
            symbol: 'tOSMO',
            name: 'Osmosis Local',
            icon_url: '/static/img/protocols/osm.png',
            type: 'chain',
            network: 'osmosis-local',
            base: 'cosmos',
            active: false,
            description: 'Osmosis Local.',
            bech32_prefix: 'osmo',
          },
        ],
        { transaction: t }
      );

      await queryInterface.bulkInsert(
        'ChainNodes',
        [
          {
            chain: 'osmosis-local',
            url: 'localhost:26657',
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
        { chain: 'osmosis-local' },
        { transaction: t }
      );
      await queryInterface.bulkDelete(
        'Chains',
        { id: ['osmosis-local'] },
        { transaction: t }
      );
    });
  },
};
