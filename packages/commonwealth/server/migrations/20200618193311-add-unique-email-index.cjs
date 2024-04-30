'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'users_email');
    return queryInterface.addIndex('Users', {
      fields: ['email'],
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'users_email');
    return queryInterface.addIndex('Users', { fields: ['email'] });
  },
};
