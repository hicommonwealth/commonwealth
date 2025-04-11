'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Communities" ADD COLUMN "tier" INTEGER NOT NULL DEFAULT 0;
        `,
        { transaction },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Communities" DROP COLUMN "tier";
        `,
        { transaction },
      );
    });
  },
};
