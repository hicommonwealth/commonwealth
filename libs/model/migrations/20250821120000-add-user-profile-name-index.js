'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE UNIQUE INDEX IF NOT EXISTS unique_profile_name_not_anonymous
          ON public."Users" (LOWER(profile ->> 'name'))
          WHERE (LOWER(profile ->> 'name') IS DISTINCT FROM 'anonymous');
      `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        DROP INDEX IF EXISTS unique_profile_name_not_anonymous;
      `,
        { transaction },
      );
    });
  },
};

