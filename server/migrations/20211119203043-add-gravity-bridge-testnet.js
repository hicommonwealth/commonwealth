'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'gravity-bridge',
        symbol: 'GRAV',
        name: 'Cosmos Gravity Bridge',
        type: 'chain',
        network: 'gravity',
        base: 'cosmos',
        active: true,
        description: '',
        bech32_prefix: 'gravity'
      }], { transaction: t });

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'gravity-bridge',
        url: 'chainripper-2.althea.net:80/',
      }], { transaction: t });
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'gravity-bridge' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['gravity-bridge'] }, { transaction: t });
    });
  }
};
