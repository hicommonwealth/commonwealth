'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE INDEX IF NOT EXISTS idx_users_profile_name
          ON public."Users" USING gin ((profile ->> 'name') public.gin_trgm_ops);
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        CREATE UNIQUE INDEX IF NOT EXISTS unique_profile_name_not_anonymous
          ON public."Users" ((profile ->> 'name'))
          WHERE ((profile ->> 'name') IS DISTINCT FROM 'Anonymous');
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS idx_users_profile_name;
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS unique_profile_name_not_anonymous;
      `,
        { transaction },
      );
    });
  },
};

