'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CommunityContractTemplateMetadata', {
      cct_id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      Slug: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nickname: {
        type: Sequelize.STRING,
        allowNulll: true,
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      display_options: {
        type: Sequelize.ENUM('0', '1', '2', '3'),
        defaultValue: '0',
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CommunityContractTemplateMetadata');
  },
};
