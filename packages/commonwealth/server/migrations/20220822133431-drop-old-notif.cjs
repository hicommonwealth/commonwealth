'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('OldNotifications', {
      cascade: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // IRREVERSIBLE
  },
};
