'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'OffchainThreads',
      'version_history',
      {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
      }
    )
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'OffchainThreads',
      'version_history',
      {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
      }
    )
  }
};
