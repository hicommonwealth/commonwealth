'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'OffchainComments',
      'child_comments',
      {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: []
      }
    )
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'OffchainComments',
      'child_comments',
      {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: []
      }
    )
  }
};
