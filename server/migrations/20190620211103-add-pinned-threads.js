'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn('OffchainThreads', 'pinned', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('OffchainThreads', 'pinned');
  }
};
