'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // add column
      await queryInterface.addColumn(
        'Addresses',
        'wallet_sso_source',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );

      // Magic linked wallets from before SSO are email-based
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_sso_source = 'email'
        WHERE verification_token = 'MAGIC';
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );

      // Magic linked wallets since then should be manually handled
      await queryInterface.sequelize.query(
        `
        UPDATE "Addresses" SET wallet_sso_source = 'unknown'
        WHERE verification_token = 'MAGIC' AND created_at > '2023-05-24 19:00:00 -0400';
      `,
        {
          raw: true,
          type: 'RAW',
          transaction,
        }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Addresses', 'wallet_sso_source', {
        transaction,
      });
    });
  },
};
