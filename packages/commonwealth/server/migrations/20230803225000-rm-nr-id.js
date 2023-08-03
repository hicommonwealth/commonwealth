'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Notifications', 'id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Notifications', 'id', {
      type: Sequelize.INTEGER,
    });
  },
};
