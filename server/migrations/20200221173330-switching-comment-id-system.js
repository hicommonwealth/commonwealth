'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.renameColumn(
      'OffchainComments',
      'object_id',
      'parent_id',
    );
    await queryInterface.addColumn(
      'OffchainComments',
      'root_id',
      {
        type: DataTypes.STRING,
        allowNull: true
      },
    );
    await queryInterface.changeColumn(
      'OffchainComments',
      'parent_id',
      {
        type: DataTypes.STRING,
        allowNull: true
      },
    );
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.renameColumn(
      'OffchainComments',
      'parent_id',
      'object_id',
    );
    await queryInterface.removeColumn(
      'OffchainComments',
      'root_id',
      {
        type: DataTypes.STRING,
        allowNull: true
      }
    );
    await queryInterface.changeColumn(
      'OffchainComments',
      'object_id',
      {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ''
      }
    );
  }
};
