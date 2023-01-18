'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'selectedAddresses', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '{}',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'selectedAddresses');
  },
};
