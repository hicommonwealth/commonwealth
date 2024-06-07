'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.transaction(async (t) => {
        await queryInterface.sequelize.query(
          `
          INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, bech32, cosmos_chain_id, slip44) VALUES (
            'evmos',
            'https://rpc.cosmos.directory/evmos',
            'https://rest.cosmos.directory/evmos',
            'cosmos',
            'evmos',
            'evmos',
            60
          );

          INSERT INTO "Communities" (id, name, default_symbol, active, network, type, base, bech32_prefix, chain_node_id) VALUES (
              'evmos',
              'Evmos',
              'EVMOS',
              true,
              'evmos',
              'chain',
              'cosmos',
              'evmos',
              (SELECT id
              FROM "ChainNodes"
              WHERE name = 'evmos')
          );

          INSERT INTO "Topics" (community_id, name, featured_in_sidebar, featured_in_new_post, created_at, updated_at) VALUES (
              'evmos-dev',
              'Test Topic',
              true,
              true,
              NOW(),
              NOW()
          );
          `,
          { raw: true, transaction: t },
        );
      });
    } catch (err) {
      // evmos already exists in production
    }
  },

  down: async (queryInterface, Sequelize) => {
    // // no down migration because evmos was added manually in production
    // await queryInterface.sequelize.transaction(async (t) => {
    //   await queryInterface.sequelize.query(
    //     `
    //     DELETE FROM "Chains" WHERE id = 'evmos';
    //     DELETE FROM "ChainNodes" WHERE name = 'evmos';
    //   `,
    //     { raw: true, transaction: t }
    //   );
    // });
  },
};
