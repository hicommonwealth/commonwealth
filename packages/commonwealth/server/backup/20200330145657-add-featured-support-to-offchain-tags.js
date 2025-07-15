'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('OffchainCommunities', 'featured_tags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('Chains', 'featured_tags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('OffchainTags', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('OffchainCommunities', 'featured_tags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.removeColumn('Chains', 'featured_tags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.removeColumn('OffchainTags', 'description', {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: '',
    });
  },
};
