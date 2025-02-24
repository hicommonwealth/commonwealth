'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ContestManagers', 'environment', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'production',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ContestManagers', 'environment');
  },
};
