'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn('InviteCodes', 'community_name', { type: DataTypes.STRING });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('InviteCodes', 'community_name');
  }
};
