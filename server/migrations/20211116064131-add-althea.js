'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'althea',
        symbol: 'ALTHEA', // TODO: Check
        name: 'Althea',
        type: 'chain',
        network: 'althea',
        base: 'cosmos',
        active: true,
        description: '',
        bech32_prefix: 'althea' // TODO: Check
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'agoric',
        url: 'https://main.rpc.althea.net:443/', // TODO: Check
      }], { transaction: t });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'althea' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['althea'] }, { transaction: t });
    });
  }
};
