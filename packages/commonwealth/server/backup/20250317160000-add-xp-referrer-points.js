'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users" ADD COLUMN "xp_referrer_points" INTEGER DEFAULT 0;
        `,
        { transaction },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Users" DROP COLUMN "xp_referrer_points";
        `,
        { transaction },
      );
    });
  },
};
