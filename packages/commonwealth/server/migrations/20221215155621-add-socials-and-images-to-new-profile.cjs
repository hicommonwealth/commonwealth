'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('Profiles');
    return queryInterface.sequelize.transaction(async (t) => {
      if (!tableDefinition.socials) {
        await queryInterface.addColumn(
          'Profiles',
          'socials',
          {
            type: Sequelize.ARRAY(Sequelize.STRING),
            allowNull: true,
          },
          { transaction: t }
        );
      }
      if (!tableDefinition.background_image) {
        await queryInterface.addColumn(
          'Profiles',
          'background_image',
          {
            type: Sequelize.JSONB,
            allowNull: true,
          },
          { transaction: t }
        );
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Profiles', 'socials', {
        transaction: t,
      });
      await queryInterface.removeColumn('Profiles', 'background_image', {
        transaction: t,
      });
    });
  },
};
