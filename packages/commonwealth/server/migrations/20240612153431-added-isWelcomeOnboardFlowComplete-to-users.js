'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Users',
        'is_welcome_onboard_flow_complete',
        {
          type: Sequelize.BOOLEAN,
          defaultValue: true, // true for all existing users
          allowNull: false,
        },
        { transaction: t },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Users',
        'is_welcome_onboard_flow_complete',
        {
          transaction: t,
        },
      );
    });
  },
};
