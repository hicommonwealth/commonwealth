'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE public."Communities" DROP COLUMN IF EXISTS "category";`,
        {
          transaction: t,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE public."Communities" ADD COLUMN "category" JSONB;`,
        {
          transaction: t,
        },
      );
    });
  },
};
