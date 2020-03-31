'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'Users',
      'lastVisited',
      {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'Users',
      'lastVisited',
      {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '{}',
      }
    );
  }
};
