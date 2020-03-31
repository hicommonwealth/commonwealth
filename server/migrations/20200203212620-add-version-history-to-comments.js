'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'OffchainComments',
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
      'OffchainComments',
      'version_history',
      {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: false,
        defaultValue: []
      }
    )
  }
};
