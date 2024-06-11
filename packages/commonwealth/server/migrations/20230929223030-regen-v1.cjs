'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET alt_wallet_url = 'https://regen.stakesystems.io'
      WHERE name = 'Regen Network';
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET alt_wallet_url = NULL
      WHERE name = 'Regen Network';
      `,
      { raw: true }
    );
  },
};
