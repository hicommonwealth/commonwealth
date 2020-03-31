'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'Roles',
      'chain_id',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'Roles',
      'chain_id',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  }
};
