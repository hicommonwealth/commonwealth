'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainThreads', 'url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
};
