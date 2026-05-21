'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Create the NftSnapshot table
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "HistoricalAllocations"
        RENAME COLUMN percent_score TO percent_allocation;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
          CREATE TABLE IF NOT EXISTS "NftSnapshot"
          (
            token_id       INTEGER NOT NULL PRIMARY KEY,
            user_id        INTEGER,
            user_tier      INTEGER,
            name           VARCHAR(500),
            holder_address VARCHAR(42)  NOT NULL,
            opensea_url    TEXT,
            traits         JSONB NOT NULL,
            opensea_rarity         JSONB,
            calculated_rarity INTEGER,
            rarity_tier INTEGER,
            equal_distribution_allocation NUMERIC,
            rarity_distribution_allocation NUMERIC,
            total_token_allocation NUMERIC,
            created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
      `,
        { transaction },
      );

      // Create the trigger function
      await queryInterface.sequelize.query(
        `
      CREATE OR REPLACE FUNCTION update_total_token_allocation()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.total_token_allocation := 
          COALESCE(NEW.equal_distribution_allocation, 0) + 
          COALESCE(NEW.rarity_distribution_allocation, 0);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `,
        { transaction },
      );

      // Create the trigger
      await queryInterface.sequelize.query(
        `
      CREATE TRIGGER trg_update_total_token_allocation
      BEFORE INSERT OR UPDATE OF equal_distribution_allocation, rarity_distribution_allocation
      ON "NftSnapshot"
      FOR EACH ROW
      EXECUTE FUNCTION update_total_token_allocation();
    `,
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "HistoricalAllocations"
        RENAME COLUMN percent_allocation TO percent_score;
      `,
        { transaction },
      );
      // Drop the trigger first
      await queryInterface.sequelize.query(
        `
      DROP TRIGGER IF EXISTS trg_update_total_token_allocation ON "NftSnapshot";
    `,
        { transaction },
      );

      // Drop the trigger function
      await queryInterface.sequelize.query(
        `
      DROP FUNCTION IF EXISTS update_total_token_allocation();
    `,
        { transaction },
      );

      // Drop the table
      await queryInterface.dropTable('NftSnapshot', { transaction });
    });
  },
};
