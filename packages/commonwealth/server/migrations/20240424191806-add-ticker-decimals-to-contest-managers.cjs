'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "ticker" character varying(255);
ALTER TABLE ONLY public."ContestManagers" ADD COLUMN "decimals" INTEGER;
ALTER TABLE ONLY public."ContestManagers" ALTER COLUMN "prize_percentage" TYPE INTEGER;
ALTER TABLE ONLY public."ContestManagers" ALTER COLUMN "payout_structure" TYPE INTEGER[];
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
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "ticker";
ALTER TABLE ONLY public."ContestManagers" DROP COLUMN IF EXISTS "decimals";
ALTER TABLE ONLY public."ContestManagers" ALTER COLUMN "prize_percentage" TYPE DOUBLE PRECISION;
ALTER TABLE ONLY public."ContestManagers" ALTER COLUMN "payout_structure" TYPE DOUBLE PRECISION[];
        `,
        {
          transaction: t,
        },
      );
    });
  },
};
