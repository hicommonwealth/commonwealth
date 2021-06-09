'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainThreads',
        'token_threshold',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainThreads',
        'token_threshold',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  }
};
