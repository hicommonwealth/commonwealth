'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn('Users', 'isAdmin', { type: DataTypes.BOOLEAN, defaultValue: false, });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('Users', 'isAdmin');
  }
};
