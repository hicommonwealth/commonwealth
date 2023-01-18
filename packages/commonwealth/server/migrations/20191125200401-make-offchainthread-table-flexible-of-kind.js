'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        'OffchainThreads',
        'category_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.changeColumn(
        'OffchainThreads',
        'body',
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.changeColumn(
        'OffchainThreads',
        'category_id',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        { transaction: t }
      );
      await queryInterface.changeColumn(
        'OffchainThreads',
        'body',
        {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        { transaction: t }
      );
    });
  },
};
