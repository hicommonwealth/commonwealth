'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'lastVisited');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'lastVisited', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '{}',
    });
  }
};
