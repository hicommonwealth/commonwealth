'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'OffchainThreads',
      'kind',
      Sequelize.STRING
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn(
      'OffchainThreads',
      'kind',
      Sequelize.STRING
    );
  },
};
