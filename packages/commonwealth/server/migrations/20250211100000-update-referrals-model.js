'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referrals" DROP COLUMN "id";
        ALTER TABLE "Referrals" RENAME COLUMN "created_off_chain_at" TO "created_at";
        DELETE FROM "Referrals" WHERE namespace_address IS NULL;
        ALTER TABLE "Referrals" ADD PRIMARY KEY ("namespace_address", "referrer_address");
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Referrals" DROP CONSTRAINT "Referrals_pkey";
        ALTER TABLE "Referrals" RENAME COLUMN "created_at" TO "created_off_chain_at";
        ALTER TABLE "Referrals" ADD COLUMN "id" SERIAL PRIMARY KEY;
        `,
        { transaction },
      );
    });
  },
};
