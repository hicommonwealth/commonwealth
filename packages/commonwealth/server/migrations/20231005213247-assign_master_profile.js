'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "legacy_user_id" INTEGER NULL;
        ALTER TABLE "Addresses" ADD COLUMN IF NOT EXISTS "legacy_profile_id" INTEGER NULL;
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
            LEFT JOIN (
              SELECT
                A2.hex,
                P2.id,
                P2.user_id,
                RANK() OVER (PARTITION BY A2.hex ORDER BY
                  COUNT(CASE WHEN P2.profile_name IS NOT NULL THEN 1 ELSE NULL END) +
                  COUNT(CASE WHEN P2.email IS NOT NULL THEN 1 ELSE NULL END) +
                  COUNT(CASE WHEN P2.bio IS NOT NULL THEN 1 ELSE NULL END) +
                  COUNT(CASE WHEN P2.avatar_url IS NOT NULL THEN 1 ELSE NULL END) +
                  COUNT(CASE WHEN P2.socials IS NOT NULL THEN 1 ELSE NULL END) +
                  COUNT(CASE WHEN P2.background_image IS NOT NULL THEN 1 ELSE NULL END) DESC
                ) AS rank
              FROM "Addresses" A2
              LEFT JOIN "Profiles" P2 ON A2.profile_id = P2.id
              WHERE A2.hex IS NOT NULL
              AND P2.id IS NOT NULL
              GROUP BY A2.hex, P2.id, P2.user_id
            ) AS P ON A.hex = P.hex
            WHERE P.rank = 1
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
        // console.log('error', e);
        throw new Error(e);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
          UPDATE "Addresses" set profile_id = "Addresses".legacy_profile_id, user_id = "Addresses".legacy_user_id where legacy_profile_id IS NOT NULL;
          ALTER TABLE "Addresses" DROP COLUMN "legacy_user_id";
          ALTER TABLE "Addresses" DROP COLUMN "legacy_profile_id";
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
