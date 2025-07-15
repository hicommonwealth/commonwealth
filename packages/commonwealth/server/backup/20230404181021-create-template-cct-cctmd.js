'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.createTable('CommunityContractTemplate', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        community_contract_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        cctmd_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
        },
        template_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
      });

      await queryInterface.createTable('CommunityContractTemplateMetadata', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          autoIncrement: true,
        },
        slug: {
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

      await queryInterface.createTable('Template', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        abi_id: { type: Sequelize.INTEGER, allowNull: false },
        name: { type: Sequelize.STRING, allowNull: false },
        template: { type: Sequelize.JSONB, allowNull: false },
      });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.dropTable('CommunityContractTemplate');
      await queryInterface.dropTable('CommunityContractTemplateMetadata');
      await queryInterface.dropTable('Template');
    });
  },
};
