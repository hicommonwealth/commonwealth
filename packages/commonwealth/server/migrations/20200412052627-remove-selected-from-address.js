'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Addresses', 'selected');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Addresses', 'selected', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },
};
