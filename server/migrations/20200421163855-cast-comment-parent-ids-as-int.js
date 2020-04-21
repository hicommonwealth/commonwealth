'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainComments', 'parent_id', {
      type: 'INTEGER USING CAST("parent_id" as INTEGER)'
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('OffchainComments', 'parent_id', {
      type: 'TEXT USING CAST("parent_id" as TEXT)'
    });
  }
};
