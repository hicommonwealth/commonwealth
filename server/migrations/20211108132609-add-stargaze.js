'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'stargaze',
        symbol: 'STARS',
        name: 'Stargaze',
        icon_url: '/static/img/protocols/stargaze.png',
        type: 'chain',
        network: 'stargaze',
        base: 'cosmos',
        active: true,
        description: 'An Interchain NFT Market.',
        bech32_prefix: 'stars'
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'stargaze',
        url: 'https://rpc.stargaze.publicawesome.dev/',
      }], { transaction: t });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'stargaze' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['stargaze'] }, { transaction: t });
    });
  }
};
