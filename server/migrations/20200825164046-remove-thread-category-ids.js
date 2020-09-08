'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.removeColumn('OffchainThreads', 'category_id');
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.addColumn('OffchainThreads', 'category_id', {
      type: DataTypes.INTEGER,
    });
  }
};
