'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add new column 'block_explorer' to the table 'ChainNodes'
      await queryInterface.addColumn(
        'ChainNodes',
        'block_explorer',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );

      const updates = [
        {
          eth_chain_id: 11155111,
          block_explorer: 'https://sepolia.etherscan.io/',
        }, // Sepolia
        {
          eth_chain_id: 84532,
          block_explorer: 'https://sepolia.basescan.org/',
        }, // Sepolia-base
        { eth_chain_id: 81457, block_explorer: 'https://blastscan.io/' }, // Blast
        { eth_chain_id: 8453, block_explorer: 'https://basescan.org/' }, // Base
      ];
      let query =
        'UPDATE "ChainNodes" SET "block_explorer" = CASE "eth_chain_id"';
      for (const update of updates) {
        query += ` WHEN ${update.eth_chain_id} THEN '${update.block_explorer}'`;
      }
      query += ' END WHERE "eth_chain_id" IN (:eth_chain_ids)';
      const eth_chain_ids = updates.map((update) => update.eth_chain_id);

      await queryInterface.sequelize.query(query, {
        replacements: { eth_chain_ids },
        transaction,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('ChainNodes', 'block_explorer', {
        transaction,
      });
    });
  },
};
