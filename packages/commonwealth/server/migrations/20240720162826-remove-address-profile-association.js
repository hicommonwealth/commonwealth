'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
ALTER TABLE public."Addresses" DROP COLUMN IF EXISTS "profile_id";
        `,
        {
          transaction: t,
        },
      );
    });
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
ALTER TABLE public."Addresses" ADD COLUMN "profile_id" INTEGER;
        `,
        {
          transaction: t,
        },
      );
    });
  },
};
