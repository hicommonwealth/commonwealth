'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, cosmos_chain_id, created_at, updated_at) VALUES (
          'Terra2',
          'https://rpc.cosmos.directory/terra2',
          'https://rest.cosmos.directory/terra2',
          'cosmos',
          'terra2',
           NOW(),
           NOW()
        );

        UPDATE "Communities" SET chain_node_id = (SELECT id FROM "ChainNodes" WHERE cosmos_chain_id = 'terra2') WHERE id = 'terra';
        `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Communities" SET chain_node_id = (SELECT id FROM "ChainNodes" WHERE name = 'Terra') WHERE id = 'terra';
        
        DELETE FROM "ChainNodes" WHERE cosmos_chain_id = 'terra2';
        `,
        { transaction },
      );
    });
  },
};
