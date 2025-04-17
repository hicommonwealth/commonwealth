'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
      UPDATE "ChainNodes"
      SET block_explorer = CASE
        WHEN eth_chain_id = 10 THEN 'https://optimistic.etherscan.io/'
        WHEN eth_chain_id = 1 THEN 'https://etherscan.io/'
        WHEN eth_chain_id = 42161 THEN 'https://arbiscan.io/'
        WHEN eth_chain_id = 137 THEN 'https://polygonscan.com/'
        WHEN eth_chain_id = 59144 THEN 'https://lineascan.build/'
        WHEN eth_chain_id = 1868 THEN 'https://soneium.blockscout.com/'
      END
      WHERE eth_chain_id IN (10, 1, 42161, 137, 59144);

      UPDATE "ChainNodes"
      SET alchemy_metadata = '{ "network_id": "soneium-mainnet", "price_api_supported": false, "transfer_api_supported": true }',
          url = 'https://soneium-mainnet.g.alchemy.com/v2/',
          private_url = 'https://soneium-mainnet.g.alchemy.com/v2/',
          max_ce_block_range = -1,
          updated_at = NOW()
      WHERE eth_chain_id = 1868;

      DELETE FROM "ChainEventXpSources";

      ALTER TABLE "ChainEventXpSources"
      ADD COLUMN "readable_signature" VARCHAR(255) NOT NULL;
    `,
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
