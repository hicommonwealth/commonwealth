'use strict';

module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'OffchainCommunities',
      'featured_tags',
      {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      }
    );
    await queryInterface.addColumn(
      'Chains',
      'featured_tags',
      {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      }
    );
    await queryInterface.addColumn(
      'OffchainTags',
      'description',
      {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      }
    );
  },

  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn(
      'OffchainCommunities',
      'featured_tags',
      {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      }
    );
    await queryInterface.removeColumn(
      'Chains',
      'featured_tags',
      {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      }
    );
    await queryInterface.removeColumn(
      'OffchainTags',
      'description',
      {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      }
    );
  }
};
