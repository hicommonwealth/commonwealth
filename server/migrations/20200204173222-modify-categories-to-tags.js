'use strict';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainTags',
        'color',
        {
          type: DataTypes.STRING,
          allowNull: false,
        },
        { transaction: t },
      );
      await queryInterface.removeColumn(
        'OffchainTags',
        'description',
        {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        { transaction: t },
      );
    });
  },

  down: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainTags',
        'color',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t },
      );
      await queryInterface.addColumn(
        'OffchainTags',
        'description',
        {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        { transaction: t },
      );
    });
  },
};
