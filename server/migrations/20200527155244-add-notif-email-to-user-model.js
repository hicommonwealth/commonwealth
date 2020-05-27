'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'Users',
      'emailNotificationInterval',
      {
        type: DataTypes.ENUM,
        allowNull: true,
        defaultValue: null,
      }
    );
  },

  down: (queryInterface, DataTypes) => {
    await queryInterface.removeColumn(
      'Users',
      'emailNotificationInterval',
      {
        type: DataTypes.ENUM,
        allowNull: true,
        defaultValue: null,
      }
    );
  }
};
