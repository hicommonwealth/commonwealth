'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'OffchainThreads',
      'kind',
      DataTypes.STRING
    )
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'OffchainThreads',
      'kind',
      DataTypes.STRING
    )
  }
};
