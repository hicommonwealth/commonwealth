'use strict';
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const privateKey =
      process.env.NEW_ALCHEMY_PRIVATE_KEY || process.env.ETH_ALCHEMY_API_KEY;
    const publicKey =
      process.env.NEW_ALCHEMY_PUBLIC_KEY || process.env.ETH_ALCHEMY_API_KEY;

    if (!privateKey || !publicKey) {
      throw new Error(
        'Must have ETH_ALCHEMY_API_KEY env var set in packages/commonwealth/.env to migrate!',
      );
    }

    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET url = regexp_replace(url, '\\/([^\\/]*)$', '${publicKey}'),
          alt_wallet_url = regexp_replace(url, '\\/([^\\/]*)$', '${publicKey}'),
          private_url = regexp_replace(url, '\\/([^\\/]*)$', '${privateKey}')
      WHERE url LIKE '%.g.alchemy%' OR private_url LIKE '%.g.alchemy%';
    `);
  },

  async down(queryInterface, Sequelize) {},
};
