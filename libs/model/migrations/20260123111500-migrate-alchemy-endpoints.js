'use strict';

/**
 * Migrate Alchemy API endpoints from deprecated alchemyapi.io to g.alchemy.com
 *
 * URL format changes:
 * - HTTPS: https://eth-mainnet.alchemyapi.io/v2/ -> https://eth-mainnet.g.alchemy.com/v2/
 * - WSS: wss://eth-mainnet.ws.alchemyapi.io/v2/ -> wss://eth-mainnet.g.alchemy.com/v2/ws
 *
 * @type {import('sequelize-cli').Migration}
 */
export default {
  async up(queryInterface) {
    // Update HTTPS URLs: replace .alchemyapi.io with .g.alchemy.com
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET
        url = REPLACE(url, '.alchemyapi.io', '.g.alchemy.com'),
        private_url = REPLACE(private_url, '.alchemyapi.io', '.g.alchemy.com'),
        alt_wallet_url = REPLACE(alt_wallet_url, '.alchemyapi.io', '.g.alchemy.com')
      WHERE
        url LIKE '%.alchemyapi.io%'
        OR private_url LIKE '%.alchemyapi.io%'
        OR alt_wallet_url LIKE '%.alchemyapi.io%'
    `);

    // Update WSS URLs: replace .ws.alchemyapi.io with .g.alchemy.com and append /ws
    // Old format: wss://eth-mainnet.ws.alchemyapi.io/v2/KEY
    // New format: wss://eth-mainnet.g.alchemy.com/v2/ws/KEY
    // The REPLACE above already changed .ws.alchemyapi.io to .ws.g.alchemy.com
    // Now fix the .ws. prefix to just . and add /ws before the API key
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET
        url = REGEXP_REPLACE(
          REPLACE(url, '.ws.g.alchemy.com', '.g.alchemy.com'),
          '/v2/([^/]+)$',
          '/v2/ws/\\1'
        ),
        private_url = REGEXP_REPLACE(
          REPLACE(private_url, '.ws.g.alchemy.com', '.g.alchemy.com'),
          '/v2/([^/]+)$',
          '/v2/ws/\\1'
        )
      WHERE
        url LIKE 'wss://%'
        AND (url LIKE '%.ws.g.alchemy.com%' OR private_url LIKE '%.ws.g.alchemy.com%')
    `);
  },

  async down(queryInterface) {
    // Revert g.alchemy.com back to alchemyapi.io
    await queryInterface.sequelize.query(`
      UPDATE "ChainNodes"
      SET
        url = REPLACE(url, '.g.alchemy.com', '.alchemyapi.io'),
        private_url = REPLACE(private_url, '.g.alchemy.com', '.alchemyapi.io'),
        alt_wallet_url = REPLACE(alt_wallet_url, '.g.alchemy.com', '.alchemyapi.io')
      WHERE
        url LIKE '%.g.alchemy.com%'
        OR private_url LIKE '%.g.alchemy.com%'
        OR alt_wallet_url LIKE '%.g.alchemy.com%'
    `);
  },
};
