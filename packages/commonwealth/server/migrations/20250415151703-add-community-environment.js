'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'Communities',
        'environment',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: 'production',
        },
        { transaction },
      );

      // remove default so environment must be explicitly set
      await queryInterface.changeColumn(
        'Communities',
        'environment',
        {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: null,
        },
        { transaction },
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Communities', 'environment', {
        transaction,
      });
    });
  },
};
