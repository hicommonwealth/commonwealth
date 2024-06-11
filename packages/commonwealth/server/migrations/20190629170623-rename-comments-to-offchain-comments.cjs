'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.renameTable('Comments', 'OffchainComments');
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.renameTable('OffchainComments', 'Comments');
  },
};
