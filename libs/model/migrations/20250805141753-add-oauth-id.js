'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Addresses',
        'oauth_user_id',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS "addresses_oauth_user_id" ON "Addresses" USING btree ("oauth_user_id") WHERE "oauth_user_id" IS NOT NULL;
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Addresses', 'oauth_user_id', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS "addresses_oauth_user_id";
      `,
        { transaction },
      );
    });
  },
};
