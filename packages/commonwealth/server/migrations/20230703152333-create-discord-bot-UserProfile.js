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
    // Delete the newly created record in the 'Profiles' table
    await queryInterface.bulkDelete('Profiles', null, {});

    // Delete the newly created record in the 'Users' table
    await queryInterface.bulkDelete('Users', null, {});
  }
};
