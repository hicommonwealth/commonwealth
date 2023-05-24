'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET "url" = REPLACE("url", 'wss://', 'https://'),
          "private_url" = REPLACE("private_url", 'wss://', 'https://')
      WHERE "url" = 'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET "url" = REPLACE("url", 'https://', 'wss://'),
          "private_url" = REPLACE("private_url", 'https://', 'wss://')
      WHERE "url" = 'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_'
    `);
  },
};
