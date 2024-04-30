'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_Users_emailNotificationInterval";'
      );
    } catch (e) {
      console.log('Dropped preexisting enum_Users_emailNotificationInterval');
    }

    await queryInterface.addColumn('Users', 'emailNotificationInterval', {
      type: Sequelize.ENUM,
      values: ['daily', 'never'],
      allowNull: false,
      defaultValue: 'never',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'emailNotificationInterval');
    await queryInterface.sequelize.query(
      'DROP TYPE "enum_Users_emailNotificationInterval";'
    );
  },
};
