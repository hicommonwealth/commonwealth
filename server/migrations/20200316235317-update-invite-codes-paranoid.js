'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('InviteCodes', 'deleted_at', { type: Sequelize.DATE });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('InviteCodes', 'deleted_at');
  }
};
