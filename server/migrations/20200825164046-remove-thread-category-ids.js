'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'category_id');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainThreads', 'category_id', {
      type: Sequelize.INTEGER,
    });
  },
};
