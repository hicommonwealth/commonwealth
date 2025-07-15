'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const user = await queryInterface.bulkInsert(
        'Users',
        [
          {
            email: 'discord@common.xyz',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { returning: true, transaction }
      );

      const userId = user[0].id;

      await queryInterface.bulkInsert(
        'Profiles',
        [
          {
            profile_name: 'Discord Bot',
            user_id: userId,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const profiles = await queryInterface.sequelize.query(
        `SELECT * FROM "Profiles" WHERE profile_name = 'Discord Bot'`,
        { transaction }
      );
      const profile = profiles[0][0];

      if (profile) {
        const profileId = profile.id;
        const userId = profile.user_id;

        await queryInterface.bulkDelete(
          'Profiles',
          { id: profileId },
          { transaction }
        );

        await queryInterface.bulkDelete(
          'Users',
          { id: userId },
          { transaction }
        );
      }
    });
  },
};
