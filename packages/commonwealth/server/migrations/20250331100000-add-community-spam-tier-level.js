'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Communities" ADD COLUMN "spam_tier_level" INTEGER NOT NULL DEFAULT 1;
        `,
        { transaction },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Communities" DROP COLUMN "spam_tier_level";
        `,
        { transaction },
      );
    });
  },
};
