'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ChainNodes" (name, url, alt_wallet_url, balance_type, cosmos_chain_id, created_at, updated_at) VALUES (
          'Cosmos Hub',
          'https://rpc.cosmos.directory/cosmoshub',
          'https://rest.cosmos.directory/cosmoshub',
          'cosmos',
          'cosmoshub',
           NOW(),
           NOW()
        );
      `,
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DELETE FROM "ChainNodes" WHERE cosmos_chain_id = 'cosmoshub';
      `,
        { transaction },
      );
    });
  },
};
