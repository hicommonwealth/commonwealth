'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove duplicate claim addresses from claims table
      await queryInterface.sequelize.query(
        `WITH ranked AS (
          SELECT user_id, address, ROW_NUMBER() OVER (PARTITION BY address ORDER BY magna_claimed_at ASC, magna_synced_at ASC) AS rn
          FROM "ClaimAddresses"
          WHERE address IS NOT null
        )
        UPDATE "ClaimAddresses" ca SET address = NULL
        WHERE ca.user_id IN (SELECT user_id FROM ranked WHERE rn > 1);
        `,
        { transaction },
      );
      // Add unique constraint to claim address
      await queryInterface.sequelize.query(
        `DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'claimaddresses_address_unique') THEN
            ALTER TABLE "ClaimAddresses" ADD CONSTRAINT claimaddresses_address_unique UNIQUE (address);
          END IF;
        END$$;
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'claimaddresses_address_unique') THEN
            ALTER TABLE "ClaimAddresses" DROP CONSTRAINT claimaddresses_address_unique;
          END IF;
        END$$;
        `,
        { transaction },
      );
    });
  },
};
