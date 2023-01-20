'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainThreads', 'body', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainThreads', 'body', {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },
};
