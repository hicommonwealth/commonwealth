'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ContestManagers', 'image_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('ContestManagers', 'image_url', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};
