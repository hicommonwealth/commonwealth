'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn('SocialAccounts', 'access_token_secret', {
        type: Sequelize.STRING,
        allowNull: true,
      }, {
        transaction: t
      });
      await queryInterface.addColumn('SocialAccounts', 'attested', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }, {
        transaction: t
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('SocialAccounts', 'access_token_secret', { transaction: t });
      await queryInterface.removeColumn('SocialAccounts', 'attested', { transaction: t });
    });
  }
};
