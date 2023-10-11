'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "ChainNodes" ADD CONSTRAINT "Chain_nodes_unique_eth_chain_id" UNIQUE (eth_chain_id);
        `,
        { raw: true, transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE "ChainNodes" DROP CONSTRAINT "Chain_nodes_unique_eth_chain_id";`,
        { raw: true, transaction: t }
      );
    });
  },
};
