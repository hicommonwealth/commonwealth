'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async ({ sequelize }) => {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `ALTER TABLE "Users" ADD COLUMN "referral_link" character varying(255);`,
        { transaction },
      );
    });
  },

  down: async ({ sequelize }) => {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `ALTER TABLE "Users" DROP COLUMN "referral_link";`,
        { transaction },
      );
    });
  },
};
