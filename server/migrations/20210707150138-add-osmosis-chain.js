'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'osmosis',
        symbol: 'OSMO',
        name: 'Osmosis',
        icon_url: '/static/img/protocols/osm.png',
        type: 'chain',
        network: 'osmosis',
        base: 'cosmos',
        active: true,
        description: 'The Cosmos AMM',
        website: 'https://osmosis.zone/',
        telegram: 'https://t.me/osmosis_chat',
        github: 'https://github.com/osmosis-labs/osmosis',
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'osmosis',
        // TODO: is this URL correct for what we need?
        url: 'osmosis-1--lcd--full.datahub.figment.io',
      }], { transaction: t });
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'osmosis' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['osmosis'] }, { transaction: t });
    });
  }
};
