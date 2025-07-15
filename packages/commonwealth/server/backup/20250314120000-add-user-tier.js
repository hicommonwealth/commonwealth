'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users" ADD COLUMN "tier" INTEGER NOT NULL DEFAULT 0;

        -- seed tiers based on verification status
        UPDATE "Users"
        SET "tier" = CASE 
            -- TODO: find tier 4 users
            WHEN EXISTS (
              SELECT 1 FROM "Addresses" A
              WHERE A."user_id" = "Users"."id"
              AND A.oauth_provider IS NOT NULL
              AND (
                (A.oauth_email IS NOT NULL AND A.oauth_email_verified = TRUE) 
                OR A.oauth_phone_number IS NOT NULL
                OR A.oauth_username IS NOT NULL
              )
            ) THEN 3
            WHEN EXISTS (
              SELECT 1 FROM "Addresses" A 
              WHERE A."user_id" = "Users"."id" 
              AND A."verified" IS NOT NULL
            ) THEN CASE WHEN "created_at" < NOW() - INTERVAL '1 week' THEN 2 ELSE 1 END
            ELSE 0
        END;
        `,
        { transaction },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users" DROP COLUMN "tier";
        `,
        { transaction },
      );
    });
  },
};
