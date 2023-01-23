'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('SsoTokens', 'profile_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Profiles', key: 'id' },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('SsoTokens', 'profile_id');
  },
};
