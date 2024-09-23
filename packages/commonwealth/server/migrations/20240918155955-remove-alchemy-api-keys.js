'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `
            UPDATE "ChainNodes"
            SET
                url = regexp_replace(url, '/[^/]*$', '/'),
                private_url = regexp_replace(private_url, '/[^/]*$', '/'),
                alt_wallet_url = regexp_replace(alt_wallet_url, '/[^/]*$', '/')
            WHERE url LIKE '%.g.alchemy%';
    `,
    );
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
