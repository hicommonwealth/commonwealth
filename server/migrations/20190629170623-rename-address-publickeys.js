'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.renameColumn('Addresses', 'public_key', 'address');
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.renameColumn('Addresses', 'address', 'public_key');
  }
};
