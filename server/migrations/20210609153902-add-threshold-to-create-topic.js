'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainTopics',
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
        'OffchainTopics',
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
