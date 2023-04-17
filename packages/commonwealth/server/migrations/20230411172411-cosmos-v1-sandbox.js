'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32) VALUES (
          'cosmos sdk devnet',
          'https://ec2-35-173-213-72.compute-1.amazonaws.com/rpc',
          'https://ec2-35-173-213-72.compute-1.amazonaws.com/lcd',
          'cosmos',
          'cosmos'
        );
        
        INSERT INTO "Chains" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
            'csdk',
            'Cosmos SDK devnet - Gov V1',
            'STAKE',
            true,
            'cosmos',
            'chain',
            'cosmos',
            'cosmos',
            (SELECT id
            FROM "ChainNodes"
            WHERE name = 'cosmos sdk devnet')
        );
        
        INSERT INTO "Topics" (chain_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
            'csdk',
            'Test Topic',
            true,
            true,
            NOW(),
            NOW()
        );
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Topics" WHERE chain_id = 'csdk';
        DELETE FROM "Chains" WHERE id = 'csdk';
        DELETE FROM "ChainNodes" WHERE name = 'cosmos sdk devnet';
      `,
        { raw: true, transaction: t }
      );
    });
  },
};
