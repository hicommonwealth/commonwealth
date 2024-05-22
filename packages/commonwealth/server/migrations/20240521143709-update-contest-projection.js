'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE ONLY public."Contests" ADD COLUMN "score" JSONB NULL;
        ALTER TABLE ONLY public."Contests" ADD COLUMN "score_updated_at" TIMESTAMPTZ NULL;
        ALTER TABLE ONLY public."Contests" DROP COLUMN "winners";
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
        ALTER TABLE ONLY public."Contests" DROP COLUMN "score";
        ALTER TABLE ONLY public."Contests" DROP COLUMN "score_updated_at";
        ALTER TABLE ONLY public."Contests" ADD COLUMN "winners" JSONB[] NULL;
        `,
        {
          transaction: t,
        },
      );
    });
  },
};
