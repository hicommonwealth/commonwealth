'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32, created_at, updated_at) VALUES (
          'cosmos sdk v0.45.0 CI',
          'http://localhost:5051/rpc',
          'http://localhost:5051/lcd/',
          'cosmos',
          'cosmos',
          NOW(),
          NOW()
        );
        
        INSERT INTO "Chains" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
            'csdk-beta-ci',
            'Cosmos SDK CI - Gov v1beta1 v0.45.0',
            'STAKE',
            true,
            'cosmos',
            'chain',
            'cosmos',
            'cosmos',
            (SELECT id
            FROM "ChainNodes"
            WHERE name = 'cosmos sdk v0.45.0 CI')
        );
        
        INSERT INTO "Topics" (chain_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
            'csdk-beta-ci',
            'Test Topic',
            true,
            true,
            NOW(),
            NOW()
        );
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32, created_at, updated_at) VALUES (
          'cosmos sdk v0.45.0',
          'https://cosmos-devnet-beta.herokuapp.com/rpc',
          'https://cosmos-devnet-beta.herokuapp.com/lcd/',
          'cosmos',
          'cosmos',
          NOW(),
          NOW()
        );
        
        INSERT INTO "Chains" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
            'csdk-beta',
            'Cosmos SDK CI - Gov v1beta1 v0.45.0',
            'STAKE',
            true,
            'cosmos',
            'chain',
            'cosmos',
            'cosmos',
            (SELECT id
            FROM "ChainNodes"
            WHERE name = 'cosmos sdk v0.45.0')
        );
        
        INSERT INTO "Topics" (chain_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
            'csdk-beta',
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
        DELETE FROM "Topics" WHERE chain_id = 'csdk-beta-ci';
        DELETE FROM "Chains" WHERE id = 'csdk-beta-ci';
        DELETE FROM "ChainNodes" WHERE name = 'cosmos sdk v0.45.0 CI';
        DELETE FROM "Topics" WHERE chain_id = 'csdk-beta';
        DELETE FROM "Chains" WHERE id = 'csdk-beta';
        DELETE FROM "ChainNodes" WHERE name = 'cosmos sdk v0.45.0';
      `,
        { raw: true, transaction: t }
      );
    });
  },
};
