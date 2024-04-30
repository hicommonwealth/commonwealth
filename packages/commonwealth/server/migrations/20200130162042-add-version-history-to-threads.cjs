'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainThreads', 'version_history', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: [],
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'version_history', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: [],
    });
  },
};
