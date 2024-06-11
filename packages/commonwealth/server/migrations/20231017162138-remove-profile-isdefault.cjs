'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Profiles', 'is_default', {
        transaction: t,
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Profiles',
        'is_default',
        { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        { transaction: t }
      );
    });
  },
};
