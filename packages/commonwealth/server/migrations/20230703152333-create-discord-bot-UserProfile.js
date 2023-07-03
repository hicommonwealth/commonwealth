'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create a record in the 'Users' table
    const user = await queryInterface.bulkInsert('Users', [{
      email: 'discord@common.xyz',
      created_at: new Date(),
      updated_at: new Date()
    }], { returning: true });

    // Get the ID of the newly created user
    const userId = user[0].id;

    // Create a record in the 'Profiles' table with the user_id
    await queryInterface.bulkInsert('Profiles', [{
      profile_name: 'Discord Bot',
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    // Find the profile with profile_name='Discord Bot'
    const profiles = await queryInterface.sequelize.query(
      `SELECT * FROM "Profiles" WHERE profile_name = 'Discord Bot'`
    );
    const profile = profiles[0][0];

    if (profile) {
      // Get the profile_id and user_id
      const profileId = profile.id;
      const userId = profile.user_id;

      // Delete the record in the 'Profiles' table
      await queryInterface.bulkDelete('Profiles', { id: profileId });

      // Delete the record in the 'Users' table
      await queryInterface.bulkDelete('Users', { id: userId });
    }
  }
};
