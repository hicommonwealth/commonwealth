'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      return queryInterface.removeColumn(
        'OffchainThreads', 'private', { transaction: t },
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      'OffchainThreads', 'private', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    );
  }
};
