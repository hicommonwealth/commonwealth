'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      'OffchainComments',
      'parent_type',
      {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'proposal'
      }
    )
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn(
      'OffchainComments',
      'parent_type',
      {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'proposal'
      }
    )
  }
};
