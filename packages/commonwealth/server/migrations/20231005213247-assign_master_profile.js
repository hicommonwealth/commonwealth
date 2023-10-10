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
          UPDATE "Addresses" A
          SET
            legacy_user_id = A.user_id,
            legacy_profile_id = A.profile_id,
            user_id = (
              SELECT P.id
              FROM "Profiles" P
              WHERE P.id = A.profile_id
              ORDER BY
                CASE WHEN P.profile_name IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN P.email IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN P.bio IS NOT NULL THEN 1 ELSE 0 END DESC
              LIMIT 1
            ),
            profile_id = (
              SELECT P.id
              FROM "Profiles" P
              WHERE P.id = A.profile_id
              ORDER BY
                CASE WHEN P.profile_name IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN P.email IS NOT NULL THEN 1 ELSE 0 END +
                CASE WHEN P.bio IS NOT NULL THEN 1 ELSE 0 END DESC
              LIMIT 1
            )
          WHERE A.hex IS NOT NULL;          
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
