'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable('CommunityContracts', { transaction });
      await queryInterface.dropTable('Contracts', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {},
};
