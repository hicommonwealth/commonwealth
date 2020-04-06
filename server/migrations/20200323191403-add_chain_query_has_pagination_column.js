'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'ChainObjectQueries',
      'has_pagination',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'ChainObjectQueries',
      'has_pagination',
      {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    );
  }
};
