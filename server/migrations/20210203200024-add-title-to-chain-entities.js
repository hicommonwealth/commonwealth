'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'ChainEntities',
      'title',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ChainEntities',
      'title',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      }
    );
  }
};
