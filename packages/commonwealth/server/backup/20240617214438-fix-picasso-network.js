'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'Communities',
        {
          bech32_prefix: 'pica',
          network: 'picasso',
        },
        {
          id: 'picasso',
        },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          // Cosmos directory hasn't updated it's url from /composable to /picasso
          url: 'https://rpc.cosmos.directory/composable',
          alt_wallet_url: 'https://rest.cosmos.directory/composable',
          name: 'Picasso',
          cosmos_chain_id: 'picasso',
        },
        {
          cosmos_chain_id: 'composable',
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkUpdate(
        'Communities',
        {
          bech32_prefix: 'centauri',
          network: 'composable-finance',
        },
        {
          id: 'picasso',
        },
        { transaction },
      );
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: 'https://rpc-composable-ia.cosmosia.notional.ventures',
          alt_wallet_url: null,
          name: 'Composable Finance',
          cosmos_chain_id: 'composable',
        },
        {
          cosmos_chain_id: 'picasso',
        },
        { transaction },
      );
    });
  },
};
