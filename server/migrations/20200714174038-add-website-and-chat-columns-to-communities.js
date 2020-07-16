'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'OffchainCommunities',
      'website',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'OffchainCommunities',
      'chat',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'OffchainCommunities',
      'telegram',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'OffchainCommunities',
      'github',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'website',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'chat',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'telegram',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'github',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn(
      'OffchainCommunities',
      'website',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.removeColumn(
      'OffchainCommunities',
      'chat',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.removeColumn(
      'OffchainCommunities',
      'telegram',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.removeColumn(
      'OffchainCommunities',
      'github',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'website',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'chat',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'telegram',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'github',
      {
        type: DataTypes.STRING,
        allowNull: true,
      }
    );
  }
};
