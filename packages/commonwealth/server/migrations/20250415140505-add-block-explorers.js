'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET block_explorer = CASE
        WHEN eth_chain_id = 10 THEN 'https://optimistic.etherscan.io/'
        WHEN eth_chain_id = 1 THEN 'https://etherscan.io/'
        WHEN eth_chain_id = 42161 THEN 'https://arbiscan.io/'
        WHEN eth_chain_id = 137 THEN 'https://polygonscan.com/'
        WHEN eth_chain_id = 59144 THEN 'https://lineascan.build/'
      END
      WHERE eth_chain_id IN (10, 1, 42161, 137, 59144);
    `);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
