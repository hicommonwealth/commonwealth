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

    const query = 'DELETE FROM pg_enum WHERE enumlabel = \'emailNotificationInterval\'';
    await queryInterface.sequelize.query(query);
  },
};
