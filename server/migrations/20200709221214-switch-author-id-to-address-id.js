'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'OffchainThreads',
      'author_id',
      'address_id'
    );
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.renameColumn(
      'OffchainThreads',
      'address_id',
      'author_id'
    );
  },
};
