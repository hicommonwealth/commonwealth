'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32) VALUES (
          'cosmos sdk v0.46.11',
          'http://localhost:5050/rpc',
          'http://localhost:5050/lcd/',
          'cosmos',
          'cosmos'
        );
        
        INSERT INTO "Chains" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
            'csdk-v1',
            'Cosmos SDK CI - Gov V1 v0.46.11',
            'STAKE',
            true,
            'cosmos',
            'chain',
            'cosmos',
            'cosmos',
            (SELECT id
            FROM "ChainNodes"
            WHERE name = 'cosmos sdk v0.46.11')
        );
        
        INSERT INTO "Topics" (chain_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
            'csdk-v1',
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
        DELETE FROM "Topics" WHERE chain_id = 'csdk-v1';
        DELETE FROM "Chains" WHERE id = 'csdk-v1';
        DELETE FROM "ChainNodes" WHERE name = 'cosmos sdk v0.46.11';
      `,
        { raw: true, transaction: t }
      );
    });
  },
};
