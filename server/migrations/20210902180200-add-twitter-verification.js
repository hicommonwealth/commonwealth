'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('Addresses', 'twitter_verified', Sequelize.BOOLEAN, { transaction: t });
      await queryInterface.addColumn('Addresses', 'twitter_verification_msg', Sequelize.TEXT, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Addresses', 'twitter_verified', { transaction: t });
      await queryInterface.removeColumn('Addresses', 'twitter_verification_msg', { transaction: t });
    });
  }
};
