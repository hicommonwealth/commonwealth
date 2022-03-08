'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('OffchainThreads', 'tag_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('OffchainThreads', 'tag_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
