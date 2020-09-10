'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.renameColumn('Addresses', 'public_key', 'address')
      .catch((err) => {
        return Promise.resolve();
      });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.renameColumn('Addresses', 'address', 'public_key')
      .catch((err) => {
        return Promise.resolve();
      });
  }
};
