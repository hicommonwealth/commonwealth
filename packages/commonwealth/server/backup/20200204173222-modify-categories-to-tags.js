'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainTags',
        'color',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainTags',
        'description',
        {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        { transaction: t }
      );
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainTags',
        'color',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainTags',
        'description',
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },
};
