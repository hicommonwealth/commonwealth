'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      try {
        await queryInterface.sequelize.query(
          'DROP TYPE "enum_Users_emailNotificationInterval" CASCADE;',
          {
            transaction,
          },
        );
      } catch (e) {
        console.log(e);
      }

      await queryInterface.addColumn(
        'Users',
        'emailNotificationInterval',
        {
          type: Sequelize.STRING,
          values: ['weekly', 'never'],
          allowNull: false,
          defaultValue: 'never',
        },
        { transaction },
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_Users_emailNotificationInterval" CASCADE;',
      );
    } catch (e) {
      console.log(e);
    }
    await queryInterface.addColumn('Users', 'emailNotificationInterval', {
      type: Sequelize.ENUM,
      values: ['daily', 'weekly', 'monthly', 'never'],
      allowNull: false,
      defaultValue: 'never',
    });
  },
};
