'use strict';

function isEmailAddress(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // backup old profile names
      await queryInterface.addColumn(
        'Profiles',
        'profile_name_backup',
        {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
          UPDATE "Profiles" SET profile_name_backup = profile_name WHERE profile_name LIKE '%@%'
        `,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          transaction,
        },
      );

      // get profiles that contain '@'
      const profiles = await queryInterface.sequelize.query(
        `SELECT id, profile_name FROM "Profiles" WHERE profile_name LIKE '%@%'`,
        {
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction,
        },
      );

      const profileIds = profiles
        .filter((p) => isEmailAddress(p.profile_name))
        .map((p) => p.id);

      if (profileIds.length > 0) {
        await queryInterface.sequelize.query(
          `UPDATE "Profiles" SET profile_name = NULL WHERE id = ANY(ARRAY[:profileIds])`,
          {
            replacements: { profileIds },
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            transaction,
          },
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // restore original profile names from backup
      await queryInterface.sequelize.query(
        `
          UPDATE "Profiles" SET profile_name = profile_name_backup WHERE profile_name_backup IS NOT NULL
        `,
        {
          type: queryInterface.sequelize.QueryTypes.UPDATE,
          transaction,
        },
      );

      // remove the backup column
      await queryInterface.removeColumn('Profiles', 'profile_name_backup', {
        transaction,
      });
    });
  },
};
