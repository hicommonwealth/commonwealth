'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {

      await queryInterface.bulkInsert('Chains', [{
        id: 'phantom-dao-mainnet',
        network: 'compound',
        type: 'dao',
        symbol: 'gPHM',
        base: 'ethereum',
        name: 'PhantomDao Mainnet',
        active: true,
      }], {
        transaction: t,
      });
      await queryInterface.bulkInsert('ChainNodes', [{
        chain: 'phantom-dao-mainnet',
        eth_chain_id: 250,
        address: '0x38a51314E772245c0dEc231223117b73C980846d',
        url: 'wss://wsapi.fantom.network/',
        alt_wallet_url: 'https://rpc.ftm.tools/',
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
