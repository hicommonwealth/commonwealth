'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Users', 'disableRichText', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Users', 'disableRichText');
  },
};
