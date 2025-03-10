'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Quests" ADD COLUMN "xp_awarded" INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE "Quests" ADD COLUMN "max_xp_to_end" INTEGER NOT NULL DEFAULT 0;
        `,
        { transaction },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Quests" DROP COLUMN "xp_awarded";
        ALTER TABLE "Quests" DROP COLUMN "max_xp_to_end";
        `,
        { transaction },
      );
    });
  },
};
