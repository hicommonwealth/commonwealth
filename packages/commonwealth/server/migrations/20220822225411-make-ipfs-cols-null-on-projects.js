'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Projects',
        'title',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'Projects',
        'description',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'Projects',
        'short_description',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'Projects',
        'cover_image',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'Projects',
        'title',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'Projects',
        'description',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'Projects',
        'short_description',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );
      await queryInterface.changeColumn(
        'Projects',
        'cover_image',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );
    });
  },
};
