'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn(
      'OffchainThreads',
      'body',
      {
        type: DataTypes.TEXT,
        allowNull: true,
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.changeColumn(
      'OffchainThreads',
      'body',
      {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    );
  }
};
