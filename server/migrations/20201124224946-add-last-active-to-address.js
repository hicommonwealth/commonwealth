'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'Addresses', 'last_active', {
        type: DataTypes.DATE,
        allowNull: true
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('Addresses', 'last_active');
  }
};
