'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('CommunityContractTemplateMetadata', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {},
};
