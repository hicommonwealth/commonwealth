'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE public."Communities" DROP COLUMN IF EXISTS "substrate_spec";`,
        {
          transaction: t,
        },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE public."Communities" ADD COLUMN IF NOT EXISTS "substrate_spec" JSONB;`,
        {
          transaction: t,
        },
      );
    });
  },
};
