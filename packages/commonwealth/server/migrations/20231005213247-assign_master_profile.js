'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Addresses" ADD COLUMN "master_user_id" INTEGER NULL;
        ALTER TABLE "Addresses" ADD COLUMN "master_profile_id" INTEGER NULL;
        `,
        { raw: true, transaction: t }
      );

      try {
        // Update the query that selects the addresses to consolidate
        // to include the profile_id column.
        const [hexes] = await queryInterface.sequelize.query(
          `
          SELECT hex, profile_id, id
          FROM "Addresses"
          WHERE hex IS NOT NULL and id > 153200
          GROUP BY hex, profile_id, id;
          `,
          { transaction: t }
        );

        for (const hex of hexes) {
          // get each address that shares the hex
          const [addresses] = await queryInterface.sequelize.query(
            `
            SELECT id, profile_id
            FROM "Addresses"
            WHERE hex = '${hex.hex}';
            `,
            { transaction: t }
          );

          let profiles = [];

          // for each address get the Profile
          for (const address of addresses) {
            const [profile] = await queryInterface.sequelize.query(
              `
              SELECT id, user_id, profile_name, bio, email
              FROM "Profiles"
              WHERE id = ${address.profile_id};
              `,
              { transaction: t }
            );
            profiles.push(profile[0]);
          }

          // if the profile has more populated fields than the current masterProfile
          // set the masterProfile to the current profile
          // The following reduce() function calculates the most populated profile in the profiles array.
          const masterProfile = profiles.reduce(
            (accumulator, currentValue) => {
              // Count the number of populated fields in the current profile.
              const numPopulatedFields = Object.keys(currentValue).filter(
                (key) => !!currentValue[key]
              ).length;

              // If the current profile has more populated fields than the accumulator, return the current profile.
              if (numPopulatedFields > accumulator.numPopulatedFields) {
                currentValue.numPopulatedFields = numPopulatedFields;
                return currentValue;
              }

              // Otherwise, return the accumulator.
              return accumulator;
            },
            { numPopulatedFields: 0 }
          );

          await queryInterface.sequelize.query(
            `
            UPDATE "Addresses"
            SET master_user_id = ${masterProfile.user_id}, master_profile_id = ${masterProfile.id}
            WHERE hex = '${hex.hex}';
            `,
            { transaction: t }
          );
        }
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
          ALTER TABLE "Addresses" DROP COLUMN "master_user_id";
          ALTER TABLE "Addresses" DROP COLUMN "master_profile_id";
        `,
        { raw: true, transaction: t }
      );
    });
  },
};
