'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'default_view',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'default_view', {
        transaction: t,
      });
    });
  },
};
