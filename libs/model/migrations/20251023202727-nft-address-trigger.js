'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Create the trigger function
      await queryInterface.sequelize.query(
        `
        CREATE OR REPLACE FUNCTION update_nft_snapshot_user_id()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Update NftSnapshot where holder_address matches the new address
          UPDATE "NftSnapshot"
          SET user_id = NEW.user_id,
              updated_at = NOW()
          WHERE LOWER(holder_address) = LOWER(NEW.address)
            AND user_id IS NULL;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
        { transaction },
      );

      // Create the trigger
      await queryInterface.sequelize.query(
        `
        CREATE TRIGGER sync_address_to_nft_snapshot
        AFTER INSERT ON "Addresses"
        FOR EACH ROW
        WHEN (NEW.user_id IS NOT NULL)
        EXECUTE FUNCTION update_nft_snapshot_user_id();
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Drop the trigger
      await queryInterface.sequelize.query(
        `DROP TRIGGER IF EXISTS sync_address_to_nft_snapshot ON "Addresses";`,
        { transaction },
      );

      // Drop the function
      await queryInterface.sequelize.query(
        `DROP FUNCTION IF EXISTS update_nft_snapshot_user_id();`,
        { transaction },
      );
    });
  },
};
