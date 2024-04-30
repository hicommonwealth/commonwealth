'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('LoginTokens', 'social_account', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('LoginTokens', 'social_account');
  },
};
