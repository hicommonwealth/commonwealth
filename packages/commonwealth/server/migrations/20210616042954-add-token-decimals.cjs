'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'decimals',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'Chains',
        'decimals',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          defaultValue: null,
        },
        { transaction: t }
      );
    });
  },
};
