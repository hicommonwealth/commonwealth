'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // FIRST: if an address does not have a user_id, remove its profile_id
      await queryInterface.sequelize.query(
        `UPDATE "Addresses" SET profile_id = NULL WHERE user_id IS NULL;`,
        { transaction }
      );
      // THEN, fix addresses by replacing their profile_id with the profile associated with their user_id
      // This is safe because we have a mandatory 1-to-1 User <> Profile mapping, (verify this beforehand:
      // `SELECT user_id, count(*) FROM "Profiles" GROUP BY user_id HAVING count(*) > 1;`) -- we expect
      // to see ~450 Address rows updated. Check the log output to verify.
      const [addresses] = await queryInterface.sequelize.query(
        `
          SELECT a.id
          FROM "Addresses" a
          JOIN "Profiles" p
          ON a.user_id = p.user_id
          WHERE a.user_id IS NOT NULL AND a.profile_id != p.id;
        `,
        { transaction }
      );
      if (addresses.length > 0) {
        const [, metadata] = await queryInterface.sequelize.query(
          `
          UPDATE "Addresses" a
          SET profile_id = p.id
          FROM "Profiles" p
          WHERE a.user_id IS NOT NULL
            AND a.user_id = p.user_id
            AND a.id IN (${addresses.map((a) => a.id).join(',')});
        `,
          { transaction }
        );
        console.log(`Update ${metadata.rowCount} Addresses to new profile_id.`);
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // IRREVERSIBLE
  },
};
