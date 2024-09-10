'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('Threads', 'body_backup', {
        transaction,
      });
      await queryInterface.renameColumn('Threads', 'body', 'body_backup', {
        transaction,
      });
      await queryInterface.renameColumn('Threads', 'plaintext', 'body', {
        transaction,
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.renameColumn('Threads', 'body', 'plaintext', {
        transaction,
      });
      await queryInterface.renameColumn('Threads', 'body_backup', 'body', {
        transaction,
      });
      await queryInterface.addColumn(
        'Threads',
        'body_backup',
        {
          type: Sequelize.STRING,
          allowNull: true,
        },
        { transaction },
      );
    });
  },
};
