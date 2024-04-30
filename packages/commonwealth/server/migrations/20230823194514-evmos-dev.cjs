'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32, created_at, updated_at) VALUES (
          'evmos dev ci',
          'http://localhost:5052/rpc',
          'http://localhost:5052/lcd/',
          'cosmos',
          'evmos',
           NOW(),
	       NOW()
        );
        
        INSERT INTO "Chains" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
            'evmos-dev-ci',
            'Evmos Dev CI',
            'STAKE',
            true,
            'cosmos',
            'chain',
            'cosmos',
            'evmos',
            (SELECT id
            FROM "ChainNodes"
            WHERE name = 'evmos dev ci')
        );
        
        INSERT INTO "Topics" (chain_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
            'evmos-dev-ci',
            'Test Topic',
            true,
            true,
            NOW(),
            NOW()
        );

        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32) VALUES (
          'evmos sandbox',
          'https://evmos-devnet-81ade29794d4.herokuapp.com/rpc',
          'https://evmos-devnet-81ade29794d4.herokuapp.com/lcd/',
          'cosmos',
          'evmos'
        );
        
        INSERT INTO "Chains" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
            'evmos-dev',
            'Evmos Sandbox',
            'EVMOS',
            true,
            'cosmos',
            'chain',
            'cosmos',
            'evmos',
            (SELECT id
            FROM "ChainNodes"
            WHERE name = 'evmos sandbox')
        );
        
        INSERT INTO "Topics" (chain_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
            'evmos-dev',
            'Test Topic',
            true,
            true,
            NOW(),
            NOW()
        );

        UPDATE "ChainNodes"
        SET alt_wallet_url = 'https://rest.cosmos.directory/injective'
        WHERE name = 'Injective (Mainnet)';
        UPDATE "ChainNodes"
        SET alt_wallet_url = 'https://rest.cosmos.directory/evmos'
        WHERE name = 'Evmos';
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "Topics" WHERE chain_id = 'evmos-dev-ci';
        DELETE FROM "Chains" WHERE id = 'evmos-dev-ci';
        DELETE FROM "ChainNodes" WHERE name = 'evmos dev ci';

        DELETE FROM "Topics" WHERE chain_id = 'evmos-dev';
        DELETE FROM "Chains" WHERE id = 'evmos-dev';
        DELETE FROM "ChainNodes" WHERE name = 'Evmos Sandbox';

        UPDATE "ChainNodes"
        SET alt_wallet_url = ''
        WHERE alt_wallet_url = 'https://rest.cosmos.directory/injective';
        UPDATE "ChainNodes"
        SET alt_wallet_url = ''
        WHERE alt_wallet_url = 'https://rest.cosmos.directory/evmos';
      `,
        { raw: true, transaction: t }
      );
    });
  },
};
