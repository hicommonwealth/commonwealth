'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        DROP TRIGGER IF EXISTS profile_sync_trigger ON public."Profiles";
        DROP FUNCTION IF EXISTS update_user_profile();
        DROP TABLE IF EXISTS public."Profiles";
        `,
        {
          transaction: t,
        },
      );
    });
  },

  async down() {
    await queryInterface.sequelize.transaction(async () => {
      // irreversible
    });
  },
};
