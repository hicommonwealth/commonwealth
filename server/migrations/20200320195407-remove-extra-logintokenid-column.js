'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'login_token_id');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'login_token_id', {
      type: Sequelize.INTEGER,
      references: { model: 'LoginTokens', key: 'id' },
    });
  },
};
