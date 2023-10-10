'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN "legacy_user_id" INTEGER NULL;
        ALTER TABLE "Addresses" ADD COLUMN "legacy_profile_id" INTEGER NULL;
        `,
        { raw: true, transaction: t }
      );
    });

    await queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.sequelize.query(
          `
          WITH MasterProfiles AS (
            SELECT
              A.hex,
              P.id AS master_profile_id,
              P.user_id AS master_user_id
            FROM "Addresses" A
            LEFT JOIN "Profiles" P ON A.profile_id = P.id
            WHERE A.hex IS NOT NULL
            AND P.id IS NOT NULL
          )
          UPDATE "Addresses" A
          SET
            legacy_user_id = A.user_id,
            legacy_profile_id = A.profile_id,
            user_id = MP.master_user_id,
            profile_id = MP.master_profile_id
          FROM MasterProfiles MP
          WHERE A.hex = MP.hex;
          `,
          { transaction: t }
        );
      } catch (e) {
        console.log('error', e);
        throw new Error(e);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE "Addresses" DROP COLUMN "legacy_user_id";
          ALTER TABLE "Addresses" DROP COLUMN "legacy_profile_id";
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
