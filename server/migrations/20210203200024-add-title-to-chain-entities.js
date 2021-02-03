'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'ChainEvents',
      'title',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      }
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'ChainEvents',
      'title',
      {
        type: Sequelize.TEXT,
        allowNull: true,
      }
    );
  }
};
