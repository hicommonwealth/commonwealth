'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET url = 'https://rpc.cosmos.directory/osmosis',
          alt_wallet_url = 'https://rest.cosmos.directory/osmosis'
      WHERE url = 'https://rpc.osmosis.zone:443';
      `,
      { raw: true }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `
      UPDATE "ChainNodes"
      SET url = 'https://rpc.osmosis.zone:443',
          alt_wallet_url = 'https://lcd-osmosis.blockapsis.com'
      WHERE url = 'https://rpc.cosmos.directory/osmosis';
      `,
      { raw: true }
    );
  }
};
