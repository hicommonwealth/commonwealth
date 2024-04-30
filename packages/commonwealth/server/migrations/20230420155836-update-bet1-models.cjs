'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'CommunityContractTemplateMetadata',
        'enabled_by',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'CommunityContractTemplateMetadata',
        'created_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'CommunityContractTemplateMetadata',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Template',
        'created_by',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Template',
        'description',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Template',
        'created_for_community',
        {
          type: Sequelize.STRING,
          allowNull: true,
          references: { model: 'Chains', key: 'id' },
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Template',
        'created_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction: t }
      );

      await queryInterface.addColumn(
        'Template',
        'updated_at',
        {
          type: Sequelize.DATE,
          allowNull: true,
        },
        { transaction: t }
      );
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn(
        'CommunityContractTemplateMetadata',
        'enabled_by',
        { transaction: t }
      );

      await queryInterface.removeColumn(
        'CommunityContractTemplateMetadata',
        'created_at',
        { transaction: t }
      );

      await queryInterface.removeColumn(
        'CommunityContractTemplateMetadata',
        'updated_at',
        { transaction: t }
      );

      await queryInterface.removeColumn('Template', 'created_at', {
        transaction: t,
      });
      await queryInterface.removeColumn('Template', 'updated_at', {
        transaction: t,
      });
      await queryInterface.removeColumn('Template', 'created_by', {
        transaction: t,
      });
      await queryInterface.removeColumn('Template', 'description', {
        transaction: t,
      });
      await queryInterface.removeColumn('Template', 'created_for_community', {
        transaction: t,
      });
    });
  },
};
