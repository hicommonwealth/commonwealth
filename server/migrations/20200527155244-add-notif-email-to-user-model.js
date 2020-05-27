'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'Users',
      'emailNotificationInterval',
      {
        type: DataTypes.ENUM,
        values: ['daily', 'weekly', 'monthly', 'never'],
        allowNull: false,
        defaultValue: 'never',
      }
    );
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn(
      'Users',
      'emailNotificationInterval',
      {
        type: DataTypes.ENUM,
        values: ['daily', 'weekly', 'monthly', 'never'],
        allowNull: true,
        defaultValue: null,
      }
    );

    await queryInterface.sequelize.query('DROP TYPE "enum_Users_emailNotificationInterval";');
  },
};
