'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {

      await queryInterface.bulkInsert('Chains', [{
        id: 'phantom-dao-testnet',
        network: 'compound',
        type: 'dao',
        symbol: 'gPHM',
        base: 'ethereum',
        name: 'PhantomDao Testnet',
        active: true,
      }], {
        transaction: t,
      });
      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'phantom-dao-testnet',
        eth_chain_id: 4002,
        address: '0x1464f060D710cbCc6adc81120b197ec825B088A1',
        url: 'wss://fantom-testnet-api.bwarelabs.com/ws/a1283302-9fa6-4cb5-8303-220f6c143520',
        alt_wallet_url: 'https://rpc.testnet.fantom.network',
      }], {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.bulkDelete('Addresses', { chain: 'phantom-dao-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('ChainNodes', { chain: 'phantom-dao-testnet' }, { transaction: t });
      await queryInterface.bulkDelete('Chains', { id: ['phantom-dao-testnet'] }, { transaction: t });
    });
  }
};
