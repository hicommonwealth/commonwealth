'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Communities',
        'profile_count',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'Communities',
        'count_updated',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction: t },
      );
    });
  },

  async down(queryInterface, _) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Communities', 'profile_count', {
        transaction: t,
      });
      await queryInterface.removeColumn('Communities', 'count_updated', {
        transaction: t,
      });
    });
  },
};
