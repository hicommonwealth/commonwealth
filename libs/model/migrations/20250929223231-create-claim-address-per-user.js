'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Load all existing users into ClaimAddresses table
      await queryInterface.sequelize.query(
        `
        INSERT INTO "ClaimAddresses" (
          user_id,
          created_at,
          updated_at
        )
        SELECT 
          u.id as user_id,
          u.created_at,
          u.updated_at
        FROM "Users" u
        WHERE u.id NOT IN (
          SELECT ca.user_id 
          FROM "ClaimAddresses" ca 
          WHERE ca.user_id IS NOT NULL
        );
      `,
        { transaction },
      );

      // 2. Create trigger function for new user insertions
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION create_claim_address_for_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO "ClaimAddresses" (
            user_id,
            created_at,
            updated_at
          ) VALUES (
            NEW.id,
            NEW.created_at,
            NEW.updated_at
          );
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `,
        { transaction },
      );

      // 3. Create trigger that fires after new user insertion
      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER trigger_create_claim_address_for_new_user
        AFTER INSERT ON "Users"
        FOR EACH ROW
        EXECUTE FUNCTION create_claim_address_for_new_user();
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Drop the trigger
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS trigger_create_claim_address_for_new_user ON "Users";
      `,
        { transaction },
      );

      // 2. Drop the trigger function
      await queryInterface.sequelize.query(
        `
        DROP FUNCTION IF EXISTS create_claim_address_for_new_user();
      `,
        { transaction },
      );
    });
  },
};
