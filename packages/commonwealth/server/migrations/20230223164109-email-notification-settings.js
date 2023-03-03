'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction(async (t) => {
      try {
        await queryInterface.sequelize.query(
          'DROP TYPE "enum_Users_emailNotificationInterval" CASCADE;',
          { transaction: t }
        );
      } catch (e) {
        console.log('Dropped preexisting enum_Users_emailNotificationInterval');
      }

      await queryInterface.addColumn(
        'Users',
        'emailNotificationInterval',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'never',
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    try {
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_Users_emailNotificationInterval" CASCADE;'
      );
    } catch (e) {
      console.log(e);
    }

    await queryInterface.addColumn('Users', 'emailNotificationInterval', {
      type: Sequelize.ENUM,
      values: ['daily', 'never'],
      allowNull: false,
      defaultValue: 'never',
    });
  },
};
