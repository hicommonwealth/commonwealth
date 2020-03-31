'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'OffchainThreads',
      'url',
      {
        type: DataTypes.TEXT,
        allowNull: true
      }
    )
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'OffchainThreads',
      'url',
      {
        type: DataTypes.TEXT,
        allowNull: true
      }
    )
  }
};
