'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('Profiles', { fields: ['user_id'] });
    await queryInterface.addIndex('Reactions', { fields: ['thread_id'] });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Profiles', 'profiles_user_id');
    await queryInterface.removeIndex('Reactions', 'reactions_thread_id');
  },
};
