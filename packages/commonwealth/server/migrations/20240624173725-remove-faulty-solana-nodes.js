'use strict';
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const privateKey =
      process.env.NEW_ALCHEMY_PRIVATE_KEY || process.env.ETH_ALCHEMY_API_KEY;
    const publicKey =
      process.env.NEW_ALCHEMY_PUBLIC_KEY || process.env.ETH_ALCHEMY_API_KEY;

    if (!privateKey || !publicKey) {
      throw new Error(
        'Must have ETH_ALCHEMY_API_KEY env var set in packages/commonwealth/.env to migrate!',
      );
    }

    // deletes fake + unused Solana ChainNodes
    await queryInterface.sequelize.transaction(async (transaction) => {
      // switch all communities away from fake ChainNodes to the real ChainNode
      await queryInterface.bulkUpdate(
        'Communities',
        {
          chain_node_id: 1404,
        },
        {
          chain_node_id: [29, 30],
        },
        { transaction },
      );

      // update the fake Solana (Devnet) node to be a real node
      await queryInterface.bulkUpdate(
        'ChainNodes',
        {
          url: `https://solana-devnet.g.alchemy.com/v2/${publicKey}`,
          alt_wallet_url: `https://solana-devnet.g.alchemy.com/v2/${publicKey}`,
          private_url: `https://solana-devnet.g.alchemy.com/v2/${privateKey}`,
        },
        {
          id: 1,
        },
        { transaction },
      );

      // update the contracts linked to the fake ChainNode
      await queryInterface.bulkUpdate(
        'Contracts',
        {
          chain_node_id: 1404,
        },
        {
          chain_node_id: 29,
        },
        { transaction },
      );

      // delete the fake chain nodes
      await queryInterface.bulkDelete(
        'ChainNodes',
        {
          id: [30, 29],
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {},
};
