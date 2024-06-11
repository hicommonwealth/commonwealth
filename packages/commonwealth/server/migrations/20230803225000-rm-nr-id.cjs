'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('NotificationsRead', 'id');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('NotificationsRead', 'id', {
      type: Sequelize.INTEGER,
    });
  },
};
