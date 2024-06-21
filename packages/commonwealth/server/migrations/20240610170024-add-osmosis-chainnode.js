'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Set cosmos_chain_id for osmosis if it's missing.
    // This is needed for Keplr wallet logins to work from the root.
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET cosmos_chain_id = 'osmosis'
      WHERE url = 'https://osmosis-rpc.cw-figment.workers.dev';
          `,
      { raw: true },
    );
  },

  down: async (queryInterface, Sequelize) => {
    // no down migration
  },
};
