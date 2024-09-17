'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'plaintext', {
        transaction,
      });
      await queryInterface.removeColumn('Threads', 'body_backup', {
        transaction,
      });
      await queryInterface.removeColumn('Comments', 'plaintext', {
        transaction,
      });
      await queryInterface.removeColumn('Comments', 'text_backup', {
        transaction,
      });
    });
  },

  // data cannot be recovered
  async down(queryInterface, Sequelize) {},
};
