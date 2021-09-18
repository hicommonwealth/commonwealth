'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Addresses',
        'twitter_verified',
        { type: Sequelize.BOOLEAN, allowNull: true },
        { transaction : t }
      );
      await queryInterface.addColumn(
        'Addresses',
        'twitter_verification_msg',
        { type: Sequelize.STRING, allowNull: true },
        { transaction : t }
      );
    });
  },

  down: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Addresses',
        'twitter_verified',
        { transaction : t }
      );
      await queryInterface.removeColumn(
        'Addresses',
        'twitter_verification_msg',
        { transaction : t }
      );
    });
  }
};
