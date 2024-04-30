'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('ContestManagers', 'paused', 'cancelled');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('ContestManagers', 'cancelled', 'paused');
  },
};
