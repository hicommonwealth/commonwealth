'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.bulkInsert('Chains', [{
          id: 'ethereum-kovan',
          network: 'ethereum',
          symbol: 'ETH',
          icon_url: '/static/img/protocols/eth.png',
          name: 'Ethereum Kovan Testnet',
          active: true,
        }], { transaction: t });

        await queryInterface.bulkInsert('ChainNodes', [{
          chain: 'ethereum-kovan',
          url: 'wss://kovan.infura.io/ws'
        }], { transaction: t });
      } catch (e) {
        console.log('Could not insert Kovan Ethereum nodes, maybe they already exist!');
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.bulkDelete('Chain', { '$or': [{
          name: 'Ethereum Kovan Testnet'
        }, {
          name: 'Ethereum'
        }] }, { transaction: t });

        await queryInterface.bulkDelete('ChainNodes', { '$or': [{
          chain: 'ethereum-kovan'
        }, {
          chain: 'ethereum'
        }] }, { transaction: t });
      } catch (e) {
        console.log('Error removing ETH chain, skipped');
      }
    });
  }
};
