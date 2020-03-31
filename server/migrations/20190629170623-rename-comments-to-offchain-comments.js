'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.renameTable('Comments', 'OffchainComments');
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.renameTable('OffchainComments', 'Comments');
  }
};
