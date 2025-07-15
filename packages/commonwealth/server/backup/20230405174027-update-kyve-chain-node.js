'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "ChainNodes" SET alt_wallet_url = 'https://api-eu-1.kyve.network/', url = 'https://rpc-eu-1.kyve.network/', bech32 = 'kyve', updated_at = NOW() WHERE name = 'KYVE Network';
        UPDATE "Chains"
        SET chain_node_id = (
          SELECT id
          FROM "ChainNodes"
          WHERE name = 'KYVE Network'
        ),
        type = 'chain', bech32_prefix = 'kyve', network = 'kyve'
        WHERE id = 'kyve';
      `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "ChainNodes" SET alt_wallet_url = '', url = '', bech32 = 'osmo' WHERE name = 'KYVE Network';
        UPDATE "Chains"
        SET chain_node_id = (
          SELECT id
          FROM "ChainNodes"
          WHERE name = 'Osmosis'
        ),
        type = 'offchain', bech32_prefix = 'osmo', network = 'osmosis'
        WHERE id = 'kyve';
      `,
        { raw: true, transaction: t }
      );
    });
  },
};
