'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ChainNodes', [
      {
        name: 'Core',
        url: 'https://rpc.coredao.org',
        eth_chain_id: 1116,
        alt_wallet_url: 'https://rpc.coredao.org',
        balance_type: 'ethereum',
        block_explorer: 'https://scan.coredao.org/',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ChainNodes', {
      eth_chain_id: 1116,
    });
  },
};
