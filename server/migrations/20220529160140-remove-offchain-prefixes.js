'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove offchain prefixes from all database tables

    return queryInterface.sequelize.transaction(async (transaction) => {
      // Zak
      // TODO

      // Jake
      // TODO
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add offchain prefixes

    return queryInterface.sequelize.transaction(async (transaction) => {
      // Zak
      // TODO

      // Jake
      // TODO
    });
  }
};
