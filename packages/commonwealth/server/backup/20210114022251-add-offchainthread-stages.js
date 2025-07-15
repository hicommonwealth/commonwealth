'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainThreads', 'stage', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: 'discussion',
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'stage');
  },
};
