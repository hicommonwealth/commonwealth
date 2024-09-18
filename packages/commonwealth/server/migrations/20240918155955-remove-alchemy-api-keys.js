'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
      UPDATE "ChainNodes"
      SET private_url = regexp_replace(private_url, '(https://[a-z]+-[a-z]+\\.g\\.alchemy\\.com)/v2/[A-Za-z0-9]+', '\\1/v2/')
      WHERE private_url ~ '^https:\\/\\/[a-z]+-[a-z]+\\.g\\.alchemy\\.com\\/v2\\/[A-Za-z0-9]+$';
    `,
        { transaction },
      );

      // separate query in case private_url is not set
      await queryInterface.sequelize.query(
        `
      UPDATE "ChainNodes"
      SET url = regexp_replace(url, '(https://[a-z]+-[a-z]+\\.g\\.alchemy\\.com)/v2/[A-Za-z0-9]+', '\\1/v2/')
      WHERE url ~ '^https:\\/\\/[a-z]+-[a-z]+\\.g\\.alchemy\\.com\\/v2\\/[A-Za-z0-9]+$';
    `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
      UPDATE "ChainNodes"
      SET alt_wallet_url = regexp_replace(alt_wallet_url, '(https://[a-z]+-[a-z]+\\.g\\.alchemy\\.com)/v2/[A-Za-z0-9]+', '\\1/v2/')
      WHERE alt_wallet_url ~ '^https:\\/\\/[a-z]+-[a-z]+\\.g\\.alchemy\\.com\\/v2\\/[A-Za-z0-9]+$';
    `,
        { transaction },
      );
    });
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
