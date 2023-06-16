'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET alt_wallet_url = 'https://rest.cosmos.directory/injective'
      WHERE name = 'Injective (Mainnet)';
      UPDATE "ChainNodes"
      SET alt_wallet_url = 'https://rest.cosmos.directory/evmos'
      WHERE name = 'Evmos';
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET alt_wallet_url = ''
      WHERE alt_wallet_url = 'https://rest.cosmos.directory/injective';
      UPDATE "ChainNodes"
      SET alt_wallet_url = ''
      WHERE alt_wallet_url = 'https://rest.cosmos.directory/evmos';
      `,
      { raw: true }
    );
  },
};
