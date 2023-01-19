'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Profiles',
        'cover_image',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Profiles', 'cover_image', {
        transaction: t,
      });
    });
  },
};
