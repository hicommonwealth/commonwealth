'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE public."SsoTokens" DROP CONSTRAINT "SsoTokens_profile_id_fkey";
        ALTER TABLE public."SsoTokens" DROP COLUMN "profile_id";
        ALTER TABLE public."SsoTokens" ALTER COLUMN "address_id" SET NOT NULL;
        ALTER TABLE public."SsoTokens" ALTER COLUMN "issuer" SET NOT NULL;
        ALTER TABLE public."SsoTokens" ALTER COLUMN "issued_at" SET NOT NULL;
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    // irreversible
  },
};
