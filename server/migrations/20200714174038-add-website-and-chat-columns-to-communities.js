'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'OffchainCommunities',
        'website',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainCommunities',
        'chat',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainCommunities',
        'telegram',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'OffchainCommunities',
        'github',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'website',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'chat',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'telegram',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.addColumn(
        'Chains',
        'github',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, DataTypes) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'website',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'chat',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'telegram',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'OffchainCommunities',
        'github',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'Chains',
        'website',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'Chains',
        'chat',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'Chains',
        'telegram',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
      await queryInterface.removeColumn(
        'Chains',
        'github',
        {
          type: DataTypes.STRING,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  }
};
