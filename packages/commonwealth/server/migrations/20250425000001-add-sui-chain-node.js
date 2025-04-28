'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const suiChainNode = {
      name: 'Sui',
      url: 'https://fullnode.mainnet.sui.io',
      balance_type: 'sui',
      block_explorer: 'https://suiscan.com/',
      created_at: new Date(),
      updated_at: new Date(),
    };

    await queryInterface.bulkInsert('ChainNodes', [suiChainNode]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ChainNodes', {
      name: 'Sui',
      url: 'https://fullnode.mainnet.sui.io',
    });
  },
};
