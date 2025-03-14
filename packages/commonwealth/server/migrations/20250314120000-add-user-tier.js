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
            WHEN "emailVerified" = TRUE THEN 3
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
