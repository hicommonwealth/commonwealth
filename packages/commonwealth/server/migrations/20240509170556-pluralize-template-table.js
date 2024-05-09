'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Template', 'Templates', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Templates"
        RENAME CONSTRAINT "Template_created_for_community_fkey" TO "Templates_created_for_community_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Templates"
        RENAME CONSTRAINT "Template_contractabi_id_fkey" TO "Templates_contractabi_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Templates"
        RENAME CONSTRAINT "Template_community_id_fkey" TO "Templates_community_id_fkey";
      `,
        { transaction },
      );
    });
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameTable('Templates', 'Template', {
        transaction,
      });
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Template"
        RENAME CONSTRAINT "Templates_created_for_community_fkey" TO "Template_created_for_community_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Template"
        RENAME CONSTRAINT "Templates_contractabi_id_fkey" TO "Template_contractabi_id_fkey";
      `,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        ALTER TABLE "Template"
        RENAME CONSTRAINT "Templates_community_id_fkey" TO "Template_community_id_fkey";
      `,
        { transaction },
      );
    });
  },
};
