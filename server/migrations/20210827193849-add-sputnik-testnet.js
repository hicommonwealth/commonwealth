'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkInsert('Chains', [{
        id: 'near-testnet',
        symbol: 'tNEAR',
        name: 'Near Protocol Testnet',
        icon_url: '/static/img/protocols/near.png',
        type: 'chain',
        network: 'near-testnet',
        base: 'near',
        active: true,
        description: '',
        website: '',
        discord: '',
        github: '',
      }], { transaction: t });

      // TODO: update URL for near mainnet

      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'near-testnet',
        url: 'https://rpc.testnet.near.org',
      }], { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('ChainNodes', { chain: 'near-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['near-testnet'] }, { transaction: t });
    });
  }
};
