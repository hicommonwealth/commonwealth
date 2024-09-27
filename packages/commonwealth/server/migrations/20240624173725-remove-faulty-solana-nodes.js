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
      console.warn(
        'ETH_ALCHEMY_API_KEY environment variable is not set in the .env.' +
          'Some features may be unavailable',
      );
    }

    // deletes fake + unused Solana ChainNodes
    await queryInterface.sequelize.transaction(async (transaction) => {
      const solanaMainnet = await queryInterface.sequelize.query(
        `
        SELECT id FROM "ChainNodes" WHERE url LIKE 'https://solana-mainnet.g.alchemy.com/%' AND name = 'Solana (Mainnet Beta)'
      `,
        { transaction, type: 'SELECT', raw: true },
      );

      const fakeSolanaMainnet = await queryInterface.sequelize.query(
        `
        SELECT id FROM "ChainNodes" WHERE url LIKE '' AND name = 'Solana (Mainnet Beta)'
      `,
        { transaction, type: 'SELECT', raw: true },
      );

      const fakeSolanaDevnet = await queryInterface.sequelize.query(
        `
        SELECT id FROM "ChainNodes" WHERE url LIKE 'testnet' AND name = 'Solana (Testnet)'
      `,
        { transaction, type: 'SELECT', raw: true },
      );

      const incompleteSolanaDevnet = await queryInterface.sequelize.query(
        `
        SELECT id FROM "ChainNodes" WHERE url LIKE 'devnet' AND name = 'Solana (Devnet)'
      `,
        { transaction, type: 'SELECT', raw: true },
      );

      // switch all communities away from fake ChainNodes to the real ChainNode
      if (
        solanaMainnet.length === 1 &&
        fakeSolanaMainnet.length === 1 &&
        fakeSolanaDevnet.length === 1
      ) {
        await queryInterface.bulkUpdate(
          'Communities',
          {
            chain_node_id: solanaMainnet[0].id,
          },
          {
            chain_node_id: [29, 30],
          },
          { transaction },
        );
      }

      if (incompleteSolanaDevnet.length === 1) {
        // update the fake Solana (Devnet) node to be a real node
        await queryInterface.bulkUpdate(
          'ChainNodes',
          {
            url: `https://solana-devnet.g.alchemy.com/v2/${publicKey}`,
            alt_wallet_url: `https://solana-devnet.g.alchemy.com/v2/${publicKey}`,
            private_url: `https://solana-devnet.g.alchemy.com/v2/${privateKey}`,
          },
          {
            id: incompleteSolanaDevnet[0].id,
          },
          { transaction },
        );
      }

      if (solanaMainnet.length === 1 && fakeSolanaMainnet.length === 1) {
        // update the contracts linked to the fake ChainNode
        await queryInterface.bulkUpdate(
          'Contracts',
          {
            chain_node_id: solanaMainnet[0].id,
          },
          {
            chain_node_id: fakeSolanaMainnet[0].id,
          },
          { transaction },
        );
      }

      if (fakeSolanaMainnet.length === 1 && fakeSolanaDevnet.length === 1) {
        // delete the fake chain nodes
        await queryInterface.bulkDelete(
          'ChainNodes',
          {
            id: [fakeSolanaMainnet[0].id, fakeSolanaDevnet[0].id],
          },
          { transaction },
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {},
};
