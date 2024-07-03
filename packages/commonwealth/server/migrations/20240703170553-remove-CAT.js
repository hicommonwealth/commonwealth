'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('CommunityContractTemplateMetadata', {
        transaction,
      });
      await queryInterface.dropTable('CommunityContractTemplate', {
        transaction,
      });
      await queryInterface.dropTable('Template', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {},
};
