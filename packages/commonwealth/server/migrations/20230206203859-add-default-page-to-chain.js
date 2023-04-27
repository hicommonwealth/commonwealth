'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'default_page',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'has_homepage',
        {
          type: Sequelize.STRING,
          allowNull: true,
          defaultValue: false,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'default_page', {
        transaction: t,
      });
      await queryInterface.removeColumn('Chains', 'has_homepage', {
        transaction: t,
      });
    });
  },
};
