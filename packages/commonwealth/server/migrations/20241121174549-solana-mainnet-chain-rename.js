'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE "ChainNodes" SET name = 'Solana Mainnet' WHERE name = 'Solana (Mainnet Beta)'`,
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE "ChainNodes" SET name = 'Solana (Mainnet Beta)' WHERE name = 'Solana Mainnet'`,
    );
  },
};
