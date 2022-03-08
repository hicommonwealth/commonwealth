'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameTable(
      'OffchainThreadCategories',
      'OffchainTags'
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameTable(
      'OffchainTags',
      'OffchainThreadCategories'
    );
  },
};
