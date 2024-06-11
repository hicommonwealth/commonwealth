'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Roles', 'chain_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Roles', 'chain_id', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
